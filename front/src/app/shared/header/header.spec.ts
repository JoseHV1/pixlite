import { TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();
  });

  it('renders the brand name', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PixLite');
  });

  it('toggles dark mode on click and reflects it on <html>', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('[aria-label="Toggle dark mode"]') as HTMLButtonElement;

    expect(document.documentElement.dataset['theme']).toBeUndefined();
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    await fixture.whenStable();
    expect(document.documentElement.dataset['theme']).toBeUndefined();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });
});
