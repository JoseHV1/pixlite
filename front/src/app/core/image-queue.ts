import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { CompressOptions, ImagesApi, uploadPercent } from './images-api';
import { QueueStatus } from '../shared/queue-status';

export const MAX_FILES_PER_BATCH = 20;

export interface QueueEntry {
  id: string;
  filename: string;
  originalSize: number;
  status: QueueStatus;
  percent: number | null;
  compressedSize: number | null;
  dataUrl: string | null;
  errorMessage: string | null;
}

@Injectable()
export class ImageQueue {
  private readonly api = inject(ImagesApi);
  private readonly _entries = signal<QueueEntry[]>([]);
  private readonly subscriptions = new Map<string, Subscription>();

  readonly entries = this._entries.asReadonly();

  addFiles(files: File[], options: CompressOptions): void {
    if (files.length === 0) return;

    const accepted = files.slice(0, MAX_FILES_PER_BATCH);
    const rejectedCount = files.length - accepted.length;

    const newEntries: QueueEntry[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      filename: file.name,
      originalSize: file.size,
      status: 'compressing',
      percent: 0,
      compressedSize: null,
      dataUrl: null,
      errorMessage: null,
    }));

    if (rejectedCount > 0) {
      newEntries.push({
        id: crypto.randomUUID(),
        filename: `${rejectedCount} file(s) skipped`,
        originalSize: 0,
        status: 'error',
        percent: null,
        compressedSize: null,
        dataUrl: null,
        errorMessage: `Only ${MAX_FILES_PER_BATCH} files can be processed per batch.`,
      });
    }

    this._entries.update((entries) => [...entries, ...newEntries]);
    if (accepted.length === 0) return;

    const ids = newEntries.slice(0, accepted.length).map((entry) => entry.id);
    const subscription = this.api
      .compress(accepted, options)
      .pipe(finalize(() => ids.forEach((id) => this.subscriptions.delete(id))))
      .subscribe({
        next: (event) => {
          const percent = uploadPercent(event);
          if (percent !== null) {
            this.updateMany(ids, percent < 100 ? { percent } : { percent: null, status: 'processing' });
          } else if (event.type === HttpEventType.Response) {
            const results = event.body?.results ?? [];
            ids.forEach((id, index) => {
              const result = results[index];
              if (!result) {
                this.updateOne(id, { status: 'error', errorMessage: 'No se recibió un resultado para este archivo.' });
              } else if (result.error) {
                this.updateOne(id, { status: 'error', errorMessage: result.error });
              } else {
                this.updateOne(id, { status: 'done', compressedSize: result.compressedSize, dataUrl: result.dataUrl });
              }
            });
          }
        },
        error: (err: unknown) => this.updateMany(ids, { status: 'error', errorMessage: describeError(err) }),
      });

    ids.forEach((id) => this.subscriptions.set(id, subscription));
  }

  removeEntry(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      // Files dropped together share one HTTP request, so cancelling one aborts
      // all of them — mark the others as errored instead of leaving them frozen.
      const siblingIds = [...this.subscriptions.entries()]
        .filter(([entryId, sub]) => sub === subscription && entryId !== id)
        .map(([entryId]) => entryId);

      subscription.unsubscribe();
      this.subscriptions.delete(id);

      if (siblingIds.length > 0) {
        this.updateMany(siblingIds, {
          status: 'error',
          percent: null,
          errorMessage: 'Cancelled — this file shared an upload with one you removed.',
        });
      }
    }

    this._entries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  downloadEntry(id: string): void {
    const entry = this._entries().find((e) => e.id === id);
    if (!entry?.dataUrl) return;
    const link = document.createElement('a');
    link.href = entry.dataUrl;
    link.download = entry.filename;
    link.click();
  }

  downloadAll(): void {
    this._entries()
      .filter((entry) => entry.status === 'done')
      .forEach((entry) => this.downloadEntry(entry.id));
  }

  private updateOne(id: string, patch: Partial<QueueEntry>): void {
    this._entries.update((entries) => entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  private updateMany(ids: string[], patch: Partial<QueueEntry>): void {
    const idSet = new Set(ids);
    this._entries.update((entries) => entries.map((entry) => (idSet.has(entry.id) ? { ...entry, ...patch } : entry)));
  }
}

function describeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const message = err.error?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    return err.statusText || 'No se pudo conectar con el servidor.';
  }
  return 'Ocurrió un error inesperado.';
}
