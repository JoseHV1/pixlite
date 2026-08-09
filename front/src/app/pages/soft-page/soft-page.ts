import { Component, inject, signal } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { QueueItemCard } from '../../shared/queue-item-card/queue-item-card';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { EntryDetailPipe } from '../../shared/entry-detail.pipe';
import { ImageQueue } from '../../core/image-queue';
import { OutputFormat } from '../../core/images-api';

@Component({
  selector: 'app-soft-page',
  imports: [Header, Footer, Dropzone, QueueItemCard, PrimaryButton, EntryDetailPipe],
  providers: [ImageQueue],
  templateUrl: './soft-page.html',
})
export class SoftPage {
  readonly queue = inject(ImageQueue);
  readonly quality = signal(85);
  readonly format = signal<OutputFormat>('original');
  readonly pendingFiles = signal<File[]>([]);

  constructor() {
    document.documentElement.dataset['theme'] = 'soft';
  }

  onQualityChange(event: Event): void {
    this.quality.set(Number((event.target as HTMLInputElement).value));
  }

  onFilesSelected(files: File[]): void {
    this.pendingFiles.update((current) => [...current, ...files]);
  }

  optimizeNow(): void {
    const files = this.pendingFiles();
    if (files.length === 0) return;
    this.queue.addFiles(files, { quality: this.quality(), format: this.format() });
    this.pendingFiles.set([]);
  }
}
