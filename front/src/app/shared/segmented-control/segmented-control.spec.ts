import { TestBed } from '@angular/core/testing';
import { SegmentedControl } from './segmented-control';

describe('SegmentedControl', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControl],
    }).compileComponents();
  });

  const options = [
    { value: 'original', label: 'Original' },
    { value: 'webp', label: 'WebP' },
    { value: 'jpeg', label: 'JPEG' },
  ];

  it('renders every option and highlights the active one', async () => {
    const fixture = TestBed.createComponent<SegmentedControl<string>>(SegmentedControl);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'webp');
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Original', 'WebP', 'JPEG']);
    expect(buttons[1].classList.contains('text-primary')).toBe(true);
    expect(buttons[0].classList.contains('text-primary')).toBe(false);
  });

  it('emits valueChange with the clicked option value', async () => {
    const fixture = TestBed.createComponent<SegmentedControl<string>>(SegmentedControl);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'original');
    await fixture.whenStable();

    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value: string) => emitted.push(value));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[2].click();

    expect(emitted).toEqual(['jpeg']);
  });
});
