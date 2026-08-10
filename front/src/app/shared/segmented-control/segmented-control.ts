import { Component, input, output } from '@angular/core';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.html',
})
export class SegmentedControl<T> {
  readonly options = input.required<SegmentedOption<T>[]>();
  readonly value = input.required<T>();

  readonly valueChange = output<T>();
}
