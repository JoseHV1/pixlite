import { TestBed } from '@angular/core/testing';
import { PrimaryButton } from './primary-button';

describe('PrimaryButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryButton],
    }).compileComponents();
  });

  it('renders the label and icon', async () => {
    const fixture = TestBed.createComponent(PrimaryButton);
    fixture.componentRef.setInput('label', 'Download All (2)');
    fixture.componentRef.setInput('icon', 'download_for_offline');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Download All (2)');
    expect(el.textContent).toContain('download_for_offline');
  });

  it('only stretches full width when fullWidth is set', async () => {
    const fixture = TestBed.createComponent(PrimaryButton);
    fixture.componentRef.setInput('label', 'Optimize Now');
    fixture.componentRef.setInput('icon', 'auto_awesome');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').classList).not.toContain('w-full');

    fixture.componentRef.setInput('fullWidth', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').classList).toContain('w-full');
  });
});
