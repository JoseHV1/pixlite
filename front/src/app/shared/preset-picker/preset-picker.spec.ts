import { TestBed } from '@angular/core/testing';
import { PresetPicker } from './preset-picker';

describe('PresetPicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresetPicker],
    }).compileComponents();
  });

  const presets = [
    { id: 'web', label: 'Web', value: { quality: 80 } },
    { id: 'email', label: 'Email', value: { quality: 60 } },
    { id: 'social', label: 'Social Media', value: { quality: 90 } },
    { id: 'max', label: 'Max Compression', value: { quality: 40 } },
  ];

  it('renders a button for every preset', async () => {
    const fixture = TestBed.createComponent<PresetPicker<{ quality: number }>>(PresetPicker);
    fixture.componentRef.setInput('presets', presets);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Web', 'Email', 'Social Media', 'Max Compression']);
  });

  it('emits the full preset value when a button is clicked', async () => {
    const fixture = TestBed.createComponent<PresetPicker<{ quality: number }>>(PresetPicker);
    fixture.componentRef.setInput('presets', presets);
    await fixture.whenStable();

    const emitted: { quality: number }[] = [];
    fixture.componentInstance.select.subscribe((value) => emitted.push(value));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[2].click();

    expect(emitted).toEqual([{ quality: 90 }]);
  });
});
