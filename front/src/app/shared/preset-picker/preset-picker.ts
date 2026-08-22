import { Component, input, output } from '@angular/core';

export interface Preset<T> {
  id: string;
  label: string;
  value: T;
}

@Component({
  selector: 'app-preset-picker',
  templateUrl: './preset-picker.html',
})
export class PresetPicker<T> {
  readonly presets = input.required<Preset<T>[]>();

  readonly select = output<T>();
}
