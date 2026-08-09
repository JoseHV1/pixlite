import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { QueueItemCard } from '../../shared/queue-item-card/queue-item-card';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { EntryDetailPipe } from '../../shared/entry-detail.pipe';
import { ImageQueue } from '../../core/image-queue';

@Component({
  selector: 'app-professional-page',
  imports: [Header, Footer, Dropzone, QueueItemCard, PrimaryButton, EntryDetailPipe],
  providers: [ImageQueue],
  templateUrl: './professional-page.html',
})
export class ProfessionalPage {
  readonly queue = inject(ImageQueue);

  constructor() {
    document.documentElement.dataset['theme'] = 'professional';
  }

  onFilesSelected(files: File[]): void {
    this.queue.addFiles(files, { quality: 80, format: 'original' });
  }
}
