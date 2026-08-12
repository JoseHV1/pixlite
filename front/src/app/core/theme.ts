import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pixlite-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readInitial());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.apply(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  private readInitial(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(isDark: boolean): void {
    if (isDark) {
      document.documentElement.dataset['theme'] = 'dark';
    } else {
      delete document.documentElement.dataset['theme'];
    }
  }
}
