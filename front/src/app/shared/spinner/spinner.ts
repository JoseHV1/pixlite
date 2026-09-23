import { Component, input } from '@angular/core';

// Inherits the text color (currentColor), so it matches whatever it sits in —
// a primary button, the busy indicator, etc.
@Component({
  selector: 'app-spinner',
  template: `<span
    role="status"
    [attr.aria-label]="label()"
    class="block rounded-full border-2 border-current border-t-transparent animate-spin"
    [style.width.px]="size()"
    [style.height.px]="size()"
  ></span>`,
  host: { class: 'inline-flex' },
})
export class Spinner {
  readonly size = input(20);
  readonly label = input('Loading');
}
