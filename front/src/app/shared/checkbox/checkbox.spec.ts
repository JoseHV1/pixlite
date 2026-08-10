import { TestBed } from '@angular/core/testing';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkbox],
    }).compileComponents();
  });

  it('renders the label and reflects the checked input', async () => {
    const fixture = TestBed.createComponent(Checkbox);
    fixture.componentRef.setInput('label', 'Strip Metadata (EXIF)');
    fixture.componentRef.setInput('checked', true);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Strip Metadata (EXIF)');
    expect(el.querySelector('input')?.checked).toBe(true);
  });

  it('emits checkedChange with the new value when toggled', async () => {
    const fixture = TestBed.createComponent(Checkbox);
    fixture.componentRef.setInput('label', 'Resize Large Images');
    await fixture.whenStable();

    const emitted: boolean[] = [];
    fixture.componentInstance.checkedChange.subscribe((value) => emitted.push(value));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([true]);
  });
});
