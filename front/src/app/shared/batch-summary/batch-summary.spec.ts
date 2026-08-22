import { TestBed } from '@angular/core/testing';
import { BatchSummary } from './batch-summary';

describe('BatchSummary', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchSummary],
    }).compileComponents();
  });

  it('renders the percent saved, count, and formatted byte totals', async () => {
    const fixture = TestBed.createComponent(BatchSummary);
    fixture.componentRef.setInput('summary', {
      doneCount: 3,
      totalOriginal: 3_000_000,
      totalCompressed: 900_000,
      percentSaved: 70,
    });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('70% smaller');
    expect(text).toContain('3 image(s) optimized');
    expect(text).toContain('2.9 MB');
    expect(text).toContain('879 KB');
  });

  it('shows a positive "bigger" label instead of a double negative when the batch net grew', async () => {
    const fixture = TestBed.createComponent(BatchSummary);
    fixture.componentRef.setInput('summary', {
      doneCount: 1,
      totalOriginal: 68,
      totalCompressed: 103,
      percentSaved: -51,
    });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('51% bigger');
    expect(text).not.toContain('-51%');
  });

  it('emits downloadAll when the button is clicked', async () => {
    const fixture = TestBed.createComponent(BatchSummary);
    fixture.componentRef.setInput('summary', {
      doneCount: 2,
      totalOriginal: 100,
      totalCompressed: 50,
      percentSaved: 50,
    });
    await fixture.whenStable();

    let emitted = false;
    fixture.componentInstance.downloadAll.subscribe(() => (emitted = true));
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(emitted).toBe(true);
  });

  it('shows the error message when zip generation fails', async () => {
    const fixture = TestBed.createComponent(BatchSummary);
    fixture.componentRef.setInput('summary', {
      doneCount: 1,
      totalOriginal: 100,
      totalCompressed: 50,
      percentSaved: 50,
    });
    fixture.componentRef.setInput('error', 'Could not create the .zip file — try downloading files individually.');
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Could not create the .zip file');
  });
});
