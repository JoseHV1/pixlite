import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import JSZip from 'jszip';
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
  originalPreviewUrl: string | null;
  // Kept around so an errored entry can be resubmitted on its own without
  // asking the user to re-drag the file from disk. Null for entries that
  // were never a real single file to begin with (e.g. the "N skipped" notice).
  file: File | null;
  options: CompressOptions | null;
}

export interface QueueSummary {
  doneCount: number;
  totalOriginal: number;
  totalCompressed: number;
  percentSaved: number;
}

@Injectable()
export class ImageQueue implements OnDestroy {
  private readonly api = inject(ImagesApi);
  private readonly _entries = signal<QueueEntry[]>([]);
  private readonly subscriptions = new Map<string, Subscription>();

  private readonly _zipError = signal<string | null>(null);
  private readonly _isZipping = signal(false);

  readonly entries = this._entries.asReadonly();
  readonly zipError = this._zipError.asReadonly();
  readonly isZipping = this._isZipping.asReadonly();

  /** Entries still uploading or being compressed server-side. */
  readonly activeCount = computed(
    () => this._entries().filter((entry) => entry.status === 'compressing' || entry.status === 'processing').length,
  );
  readonly isBusy = computed(() => this.activeCount() > 0 || this._isZipping());

  readonly summary = computed<QueueSummary>(() => {
    const done = this._entries().filter((entry) => entry.status === 'done' && entry.compressedSize !== null);
    const totalOriginal = done.reduce((sum, entry) => sum + entry.originalSize, 0);
    const totalCompressed = done.reduce((sum, entry) => sum + (entry.compressedSize ?? 0), 0);
    return {
      doneCount: done.length,
      totalOriginal,
      totalCompressed,
      percentSaved: totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0,
    };
  });

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
      originalPreviewUrl: URL.createObjectURL(file),
      file,
      options,
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
        originalPreviewUrl: null,
        file: null,
        options: null,
      });
    }

    this._entries.update((entries) => [...entries, ...newEntries]);
    if (accepted.length === 0) return;

    const ids = newEntries.slice(0, accepted.length).map((entry) => entry.id);
    this.startUpload(ids, accepted, options);
  }

  /**
   * Resubmits a single errored entry on its own — most useful for a file
   * that was never actually broken, just caught in the blast radius of a
   * sibling's cancellation (files dropped together share one HTTP request).
   */
  retryEntry(id: string): void {
    const entry = this._entries().find((e) => e.id === id);
    if (!entry || entry.status !== 'error' || !entry.file || !entry.options) return;

    this.updateOne(id, { status: 'compressing', percent: 0, errorMessage: null });
    this.startUpload([id], [entry.file], entry.options);
  }

  removeEntry(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      // Files dropped together share one HTTP request, so cancelling one aborts
      // all of them — mark the others as errored instead of leaving them frozen.
      // (They can be individually retried afterward — see retryEntry above.)
      const siblingIds = [...this.subscriptions.entries()]
        .filter(([entryId, sub]) => sub === subscription && entryId !== id)
        .map(([entryId]) => entryId);

      subscription.unsubscribe();
      this.subscriptions.delete(id);

      if (siblingIds.length > 0) {
        this.updateMany(siblingIds, {
          status: 'error',
          percent: null,
          errorMessage: 'Cancelled — this file shared an upload with one you removed. You can retry it.',
        });
      }
    }

    const removed = this._entries().find((entry) => entry.id === id);
    if (removed?.originalPreviewUrl) {
      URL.revokeObjectURL(removed.originalPreviewUrl);
    }
    this._entries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  ngOnDestroy(): void {
    for (const entry of this._entries()) {
      if (entry.originalPreviewUrl) URL.revokeObjectURL(entry.originalPreviewUrl);
    }
  }

  downloadEntry(id: string): void {
    const entry = this._entries().find((e) => e.id === id);
    if (!entry?.dataUrl) return;
    const link = document.createElement('a');
    link.href = entry.dataUrl;
    link.download = entry.filename;
    link.click();
  }

  async downloadAllAsZip(): Promise<void> {
    const done = this._entries().filter((entry) => entry.status === 'done' && entry.dataUrl);
    if (done.length === 0 || this._isZipping()) return;

    this._zipError.set(null);
    this._isZipping.set(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();
      for (const entry of done) {
        const base64 = entry.dataUrl!.split(',')[1] ?? '';
        zip.file(dedupeFilename(entry.filename, usedNames), base64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pixlite-optimized-images.zip';
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      // Failures here (e.g. zip generation running out of memory on a huge
      // batch) would otherwise only surface as an invisible unhandled
      // rejection — give the user something to see instead.
      this._zipError.set('Could not create the .zip file — try downloading files individually.');
    } finally {
      this._isZipping.set(false);
    }
  }

  /** Shared by addFiles (a whole batch) and retryEntry (a single file). */
  private startUpload(ids: string[], files: File[], options: CompressOptions): void {
    const subscription = this.api
      .compress(files, options)
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

  private updateOne(id: string, patch: Partial<QueueEntry>): void {
    this._entries.update((entries) => entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  private updateMany(ids: string[], patch: Partial<QueueEntry>): void {
    const idSet = new Set(ids);
    this._entries.update((entries) => entries.map((entry) => (idSet.has(entry.id) ? { ...entry, ...patch } : entry)));
  }
}

function dedupeFilename(filename: string, usedNames: Set<string>): string {
  if (!usedNames.has(filename)) {
    usedNames.add(filename);
    return filename;
  }

  const dotIndex = filename.lastIndexOf('.');
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex > 0 ? filename.slice(dotIndex) : '';

  let counter = 2;
  let candidate = `${base} (${counter})${ext}`;
  while (usedNames.has(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }
  usedNames.add(candidate);
  return candidate;
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
