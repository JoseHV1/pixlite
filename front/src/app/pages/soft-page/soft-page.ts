import { Component, inject, signal } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { QueueItemCard } from '../../shared/queue-item-card/queue-item-card';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { QualitySlider } from '../../shared/quality-slider/quality-slider';
import { SegmentedControl, SegmentedOption } from '../../shared/segmented-control/segmented-control';
import { Checkbox } from '../../shared/checkbox/checkbox';
import { EntryDetailPipe } from '../../shared/entry-detail.pipe';
import { ImageQueue } from '../../core/image-queue';
import { OutputFormat } from '../../core/images-api';

@Component({
  selector: 'app-soft-page',
  imports: [
    Header,
    Footer,
    Dropzone,
    QueueItemCard,
    PrimaryButton,
    QualitySlider,
    SegmentedControl,
    Checkbox,
    EntryDetailPipe,
  ],
  providers: [ImageQueue],
  templateUrl: './soft-page.html',
})
export class SoftPage {
  readonly queue = inject(ImageQueue);
  readonly quality = signal(80);
  readonly format = signal<OutputFormat>('original');
  readonly stripMetadata = signal(true);
  readonly resizeLargeImages = signal(false);
  readonly pendingFiles = signal<File[]>([]);

  readonly formatOptions: SegmentedOption<OutputFormat>[] = [
    { value: 'original', label: 'Original' },
    { value: 'webp', label: 'WebP' },
    { value: 'jpeg', label: 'JPEG' },
  ];

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
