import { Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../core/theme';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  readonly theme = inject(ThemeService);
  readonly isHelpOpen = signal(false);

  toggleHelp(): void {
    this.isHelpOpen.update((open) => !open);
  }

  closeHelp(): void {
    this.isHelpOpen.set(false);
  }
}
