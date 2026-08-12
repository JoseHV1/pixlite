import { TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    }).compileComponents();
  });

  it('renders the copyright', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PixLite');
  });

  it('renders GitHub, LinkedIn and Portfolio links', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[aria-label="GitHub"]')).toBeTruthy();
    expect(el.querySelector('a[aria-label="LinkedIn"]')).toBeTruthy();
    expect(el.querySelector('a[aria-label="Portfolio"]')?.getAttribute('href')).toBe(
      'https://jose-hernandez.dev',
    );
  });
});
