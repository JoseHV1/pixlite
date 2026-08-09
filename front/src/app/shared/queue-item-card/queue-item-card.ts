import { Component, computed, input, output } from '@angular/core';
import { QueueStatus } from '../queue-status';

@Component({
  selector: 'app-queue-item-card',
  templateUrl: './queue-item-card.html',
})
export class QueueItemCard {
  readonly filename = input.required<string>();
  readonly status = input.required<QueueStatus>();
  readonly detail = input('');
  readonly percent = input<number | null>(null);
  readonly thumbnailUrl = input<string | null>(null);

  readonly cancel = output<void>();
  readonly download = output<void>();

  readonly containerClass = computed(() => {
    if (this.status() === 'done') return 'border-primary/20 bg-primary/5';
    if (this.status() === 'error') return 'border-error/40 bg-error/5';
    return 'border-outline-variant bg-surface';
  });
}
