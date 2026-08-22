import { TestBed } from '@angular/core/testing';
import { BeforeAfterSlider } from './before-after-slider';

describe('BeforeAfterSlider', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeforeAfterSlider],
    }).compileComponents();
  });

  it('renders both images and defaults the split to 50%', async () => {
    const fixture = TestBed.createComponent(BeforeAfterSlider);
    fixture.componentRef.setInput('beforeUrl', 'blob:before');
    fixture.componentRef.setInput('afterUrl', 'blob:after');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const images = el.querySelectorAll('img');
    expect(images[0].getAttribute('src')).toBe('blob:before');
    expect(images[1].getAttribute('src')).toBe('blob:after');
    expect((el.querySelector('input[type="range"]') as HTMLInputElement).value).toBe('50');
  });

  it('renders custom labels', async () => {
    const fixture = TestBed.createComponent(BeforeAfterSlider);
    fixture.componentRef.setInput('beforeUrl', 'blob:before');
    fixture.componentRef.setInput('afterUrl', 'blob:after');
    fixture.componentRef.setInput('beforeLabel', 'Antes');
    fixture.componentRef.setInput('afterLabel', 'Después');
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Antes');
    expect(text).toContain('Después');
  });

  it('updates the clip-path of the "after" image as the range moves', async () => {
    const fixture = TestBed.createComponent(BeforeAfterSlider);
    fixture.componentRef.setInput('beforeUrl', 'blob:before');
    fixture.componentRef.setInput('afterUrl', 'blob:after');
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    input.value = '80';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.percent()).toBe(80);
    const afterImg = fixture.nativeElement.querySelectorAll('img')[1] as HTMLImageElement;
    expect(afterImg.style.clipPath).toBe('inset(0 20% 0 0)');
  });
});
