import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-before-after-slider',
  templateUrl: './before-after-slider.html',
  styleUrl: './before-after-slider.css',
})
export class BeforeAfterSlider {
  readonly beforeUrl = input.required<string>();
  readonly afterUrl = input.required<string>();
  readonly beforeLabel = input('Original');
  readonly afterLabel = input('Compressed');

  readonly percent = signal(50);

  onInput(event: Event): void {
    this.percent.set(Number((event.target as HTMLInputElement).value));
  }
}
