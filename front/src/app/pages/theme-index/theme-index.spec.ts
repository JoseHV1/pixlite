import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThemeIndex } from './theme-index';

describe('ThemeIndex', () => {
  beforeEach(async () => {
    document.documentElement.dataset['theme'] = 'dark';
    await TestBed.configureTestingModule({
      imports: [ThemeIndex],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('clears any previously set theme', () => {
    TestBed.createComponent(ThemeIndex);
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('links to the 3 theme routes', async () => {
    const fixture = TestBed.createComponent(ThemeIndex);
    await fixture.whenStable();
    const hrefs = Array.from(fixture.nativeElement.querySelectorAll('a')).map((a) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/professional');
    expect(hrefs).toContain('/dark');
    expect(hrefs).toContain('/soft');
  });
});
