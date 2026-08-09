import { TestBed } from '@angular/core/testing';
import { QueueItemCard } from './queue-item-card';

describe('QueueItemCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueItemCard],
    }).compileComponents();
  });

  function create(inputs: Partial<Record<'filename' | 'status' | 'detail' | 'percent', unknown>>) {
    const fixture = TestBed.createComponent(QueueItemCard);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    return fixture;
  }

  it('shows a progress bar and emits cancel while compressing', async () => {
    const fixture = create({ filename: 'beach.jpg', status: 'compressing', percent: 80 });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('beach.jpg');
    expect(el.textContent).toContain('80%');
    expect(el.querySelector('[style*="width"]')).toBeTruthy();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));
    (el.querySelector('button[aria-label="Cancel"]') as HTMLButtonElement).click();
    expect(cancelled).toBe(true);
  });

  it('shows a download action and emits download when done', async () => {
    const fixture = create({ filename: 'logo.svg', status: 'done', detail: 'Optimized: 45 KB → 12 KB (-73%)' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Done');
    expect(el.textContent).toContain('-73%');
    expect(el.querySelector('button[aria-label="Cancel"]')).toBeFalsy();

    let downloaded = false;
    fixture.componentInstance.download.subscribe(() => (downloaded = true));
    (el.querySelector('button[aria-label="Download individual file"]') as HTMLButtonElement).click();
    expect(downloaded).toBe(true);
  });

  it('renders an error state with the failure message', async () => {
    const fixture = create({ filename: 'huge.png', status: 'error', detail: 'File too large' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Error');
    expect(el.textContent).toContain('File too large');
    expect(el.querySelector('button[aria-label="Cancel"]')).toBeTruthy();
  });
});
