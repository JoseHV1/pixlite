import { Pipe, PipeTransform } from '@angular/core';
import { QueueEntry } from '../core/image-queue';

@Pipe({ name: 'entryDetail' })
export class EntryDetailPipe implements PipeTransform {
  transform(entry: QueueEntry): string {
    if (entry.status === 'error') return entry.errorMessage ?? 'Something went wrong.';
    if (entry.status === 'done' && entry.compressedSize !== null) {
      const sizes = `${formatBytes(entry.originalSize)} → ${formatBytes(entry.compressedSize)}`;
      if (entry.originalSize === 0) return sizes;

      const delta = entry.originalSize - entry.compressedSize;
      const percent = Math.round((Math.abs(delta) / entry.originalSize) * 100);
      const sign = delta >= 0 ? '-' : '+';
      return `${sizes} (${sign}${percent}%)`;
    }
    if (entry.status === 'compressing') return `Uploading... (${formatBytes(entry.originalSize)})`;
    if (entry.status === 'processing') return 'Compressing on server...';
    return '';
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
