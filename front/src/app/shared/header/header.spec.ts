import { TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();
  });

  it('renders the brand name and nav links', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PixLite');
    expect(text).toContain('Compress');
    expect(text).toContain('Convert');
  });
});
