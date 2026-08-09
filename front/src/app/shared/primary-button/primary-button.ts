import { Component, input } from '@angular/core';

@Component({
  selector: 'app-primary-button',
  templateUrl: './primary-button.html',
})
export class PrimaryButton {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly fullWidth = input(false);
}
