import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { QueueStatus } from '../queue-status';
import { BeforeAfterSlider } from '../before-after-slider/before-after-slider';

@Component({
  selector: 'app-queue-item-card',
  imports: [BeforeAfterSlider],
  templateUrl: './queue-item-card.html',
})
export class QueueItemCard {
  readonly filename = input.required<string>();
  readonly status = input.required<QueueStatus>();
  readonly detail = input('');
  readonly percent = input<number | null>(null);
  readonly thumbnailUrl = input<string | null>(null);
  readonly originalPreviewUrl = input<string | null>(null);
  readonly canRetry = input(false);

  readonly cancel = output<void>();
  readonly download = output<void>();
  readonly retry = output<void>();

  readonly showCompare = signal(false);

  readonly canCompare = computed(
    () => this.status() === 'done' && !!this.thumbnailUrl() && !!this.originalPreviewUrl(),
  );

  readonly containerClass = computed(() => {
    if (this.status() === 'done') return 'border-primary/20 bg-primary/5 animate-pop';
    if (this.status() === 'error') return 'border-error/40 bg-error/5';
    return 'border-outline-variant bg-surface';
  });

  openCompare(): void {
    if (this.canCompare()) this.showCompare.set(true);
  }

  closeCompare(): void {
    this.showCompare.set(false);
  }

  // The "Compare" button that opens the overlay keeps DOM focus, so a
  // (keydown.escape) bound to the overlay div (its sibling, not an
  // ancestor) never receives the bubbled event. Listening on the document
  // instead makes Escape work regardless of what currently has focus.
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showCompare()) this.closeCompare();
  }
}
