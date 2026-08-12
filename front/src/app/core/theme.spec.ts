import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    TestBed.configureTestingModule({});
  });

  it('defaults to light when nothing is stored and there is no system preference', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('toggle() flips state, reflects it on <html>, and persists the choice', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('pixlite-theme')).toBe('dark');

    service.toggle();
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem('pixlite-theme')).toBe('light');
  });

  it('restores a previously stored dark preference on init', () => {
    localStorage.setItem('pixlite-theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
