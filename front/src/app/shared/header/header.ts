import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  readonly theme = inject(ThemeService);
}
