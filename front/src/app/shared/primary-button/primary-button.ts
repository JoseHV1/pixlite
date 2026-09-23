import { Component, input } from '@angular/core';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-primary-button',
  imports: [Spinner],
  templateUrl: './primary-button.html',
})
export class PrimaryButton {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly fullWidth = input(false);
  readonly loading = input(false);
  readonly loadingLabel = input('Working...');
}
