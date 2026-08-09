import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ThemeOption {
  path: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-theme-index',
  imports: [RouterLink],
  templateUrl: './theme-index.html',
})
export class ThemeIndex {
  constructor() {
    delete document.documentElement.dataset['theme'];
  }

  readonly themes: ThemeOption[] = [
    { path: '/professional', name: 'Clean Professional', description: 'Light, plum accent, tight radii — standard web workflow.' },
    { path: '/dark', name: 'Modern Dark', description: 'Dark navy background, emerald accent — creative/late-night use.' },
    { path: '/soft', name: 'Soft Minimalist', description: 'Rounded shapes, Outfit type — friendly, casual use.' },
  ];
}
