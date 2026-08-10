import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-quality-slider',
  templateUrl: './quality-slider.html',
})
export class QualitySlider {
  readonly label = input('Quality');
  readonly value = input.required<number>();
  readonly min = input(1);
  readonly max = input(100);
  readonly step = input(1);

  readonly valueChange = output<number>();

  onInput(event: Event): void {
    this.valueChange.emit(Number((event.target as HTMLInputElement).value));
  }
}
