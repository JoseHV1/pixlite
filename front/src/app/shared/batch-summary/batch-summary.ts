import { Component, computed, input, output } from '@angular/core';
import { QueueSummary } from '../../core/image-queue';
import { formatBytes } from '../entry-detail.pipe';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-batch-summary',
  imports: [Spinner],
  templateUrl: './batch-summary.html',
})
export class BatchSummary {
  readonly summary = input.required<QueueSummary>();
  readonly error = input<string | null>(null);
  readonly zipping = input(false);

  readonly downloadAll = output<void>();

  readonly formattedOriginal = computed(() => formatBytes(this.summary().totalOriginal));
  readonly formattedCompressed = computed(() => formatBytes(this.summary().totalCompressed));

  // A batch can net grow (e.g. tiny/already-optimized images re-encoded with
  // metadata), so avoid a double negative like "-51% smaller" — show the
  // absolute value with a label that matches the actual direction instead.
  readonly isSmaller = computed(() => this.summary().percentSaved >= 0);
  readonly displayPercent = computed(() => Math.abs(this.summary().percentSaved));
}
