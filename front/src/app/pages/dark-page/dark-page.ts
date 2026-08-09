import { Component, inject, signal } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { QueueItemCard } from '../../shared/queue-item-card/queue-item-card';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { EntryDetailPipe } from '../../shared/entry-detail.pipe';
import { ImageQueue } from '../../core/image-queue';

@Component({
  selector: 'app-dark-page',
  imports: [Header, Footer, Dropzone, QueueItemCard, PrimaryButton, EntryDetailPipe],
  providers: [ImageQueue],
  templateUrl: './dark-page.html',
})
export class DarkPage {
  readonly queue = inject(ImageQueue);
  readonly quality = signal(80);

  constructor() {
    document.documentElement.dataset['theme'] = 'dark';
  }

  onQualityChange(event: Event): void {
    this.quality.set(Number((event.target as HTMLInputElement).value));
  }

  onFilesSelected(files: File[]): void {
    this.queue.addFiles(files, { quality: this.quality(), format: 'original' });
  }
}
