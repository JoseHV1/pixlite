import { TestBed } from '@angular/core/testing';
import { QualitySlider } from './quality-slider';

describe('QualitySlider', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualitySlider],
    }).compileComponents();
  });

  it('renders the label and current value', async () => {
    const fixture = TestBed.createComponent(QualitySlider);
    fixture.componentRef.setInput('value', 85);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Quality');
    expect(el.textContent).toContain('85%');
    expect((el.querySelector('input') as HTMLInputElement).value).toBe('85');
  });

  it('emits valueChange as a number when the range input changes', async () => {
    const fixture = TestBed.createComponent(QualitySlider);
    fixture.componentRef.setInput('value', 85);
    await fixture.whenStable();

    const emitted: number[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '42';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toEqual([42]);
  });
});
