import { Component, inject, signal } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { QueueItemCard } from '../../shared/queue-item-card/queue-item-card';
import { PrimaryButton } from '../../shared/primary-button/primary-button';
import { QualitySlider } from '../../shared/quality-slider/quality-slider';
import { SegmentedControl, SegmentedOption } from '../../shared/segmented-control/segmented-control';
import { Checkbox } from '../../shared/checkbox/checkbox';
import { BatchSummary } from '../../shared/batch-summary/batch-summary';
import { PresetPicker, Preset } from '../../shared/preset-picker/preset-picker';
import { EntryDetailPipe } from '../../shared/entry-detail.pipe';
import { Spinner } from '../../shared/spinner/spinner';
import { ImageQueue } from '../../core/image-queue';
import { OutputFormat } from '../../core/images-api';

interface CompressionPreset {
  quality: number;
  format: OutputFormat;
  resizeLargeImages: boolean;
}

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
    BatchSummary,
    PresetPicker,
    EntryDetailPipe,
    Spinner,
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

  // One click sets quality + format + resize together — quick starting
  // points for a use case, not mutually exclusive with fine-tuning afterward.
  readonly presets: Preset<CompressionPreset>[] = [
    { id: 'web', label: 'Web', value: { quality: 80, format: 'webp', resizeLargeImages: true } },
    { id: 'email', label: 'Email', value: { quality: 60, format: 'jpeg', resizeLargeImages: true } },
    { id: 'social', label: 'Social Media', value: { quality: 90, format: 'jpeg', resizeLargeImages: true } },
    { id: 'max', label: 'Max Compression', value: { quality: 40, format: 'webp', resizeLargeImages: true } },
  ];

  onFilesSelected(files: File[]): void {
    this.pendingFiles.update((current) => [...current, ...files]);
  }

  removePendingFile(index: number): void {
    this.pendingFiles.update((current) => current.filter((_, i) => i !== index));
  }

  applyPreset(preset: CompressionPreset): void {
    this.quality.set(preset.quality);
    this.format.set(preset.format);
    this.resizeLargeImages.set(preset.resizeLargeImages);
  }

  optimizeNow(): void {
    const files = this.pendingFiles();
    if (files.length === 0) return;
    this.queue.addFiles(files, {
      quality: this.quality(),
      format: this.format(),
      stripMetadata: this.stripMetadata(),
      resizeLargeImages: this.resizeLargeImages(),
    });
    this.pendingFiles.set([]);
  }
}
