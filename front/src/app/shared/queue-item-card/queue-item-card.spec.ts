import { TestBed } from '@angular/core/testing';
import { QueueItemCard } from './queue-item-card';

describe('QueueItemCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueItemCard],
    }).compileComponents();
  });

  function create(inputs: Partial<Record<'filename' | 'status' | 'detail' | 'percent' | 'canRetry', unknown>>) {
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

  it('opens and closes the before/after compare overlay when both previews are available', async () => {
    const fixture = TestBed.createComponent(QueueItemCard);
    fixture.componentRef.setInput('filename', 'beach.jpg');
    fixture.componentRef.setInput('status', 'done');
    fixture.componentRef.setInput('thumbnailUrl', 'blob:compressed');
    fixture.componentRef.setInput('originalPreviewUrl', 'blob:original');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const compareButton = el.querySelector('[aria-label="Compare original vs compressed"]') as HTMLButtonElement;
    expect(compareButton.disabled).toBe(false);
    expect(el.querySelector('app-before-after-slider')).toBeFalsy();

    compareButton.click();
    await fixture.whenStable();
    expect(el.querySelector('app-before-after-slider')).toBeTruthy();

    const closeButton = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Close');
    closeButton?.click();
    await fixture.whenStable();
    expect(el.querySelector('app-before-after-slider')).toBeFalsy();
  });

  it('closes the compare overlay on Escape even though the button that opened it keeps focus', async () => {
    const fixture = TestBed.createComponent(QueueItemCard);
    fixture.componentRef.setInput('filename', 'beach.jpg');
    fixture.componentRef.setInput('status', 'done');
    fixture.componentRef.setInput('thumbnailUrl', 'blob:compressed');
    fixture.componentRef.setInput('originalPreviewUrl', 'blob:original');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const compareButton = el.querySelector('[aria-label="Compare original vs compressed"]') as HTMLButtonElement;
    compareButton.click();
    compareButton.focus();
    await fixture.whenStable();
    expect(el.querySelector('app-before-after-slider')).toBeTruthy();

    // Dispatched on the button itself (which still has focus), not on the
    // overlay — this is exactly the bubbling path that broke before.
    compareButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(el.querySelector('app-before-after-slider')).toBeFalsy();
  });

  it('leaves the thumbnail non-interactive without an original preview to compare against', async () => {
    const fixture = TestBed.createComponent(QueueItemCard);
    fixture.componentRef.setInput('filename', 'beach.jpg');
    fixture.componentRef.setInput('status', 'done');
    fixture.componentRef.setInput('thumbnailUrl', 'blob:compressed');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-label="Compare original vs compressed"]')).toBeFalsy();
  });

  it('renders an error state with the failure message and a Remove action, no Retry by default', async () => {
    const fixture = create({ filename: 'huge.png', status: 'error', detail: 'File too large' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Error');
    expect(el.textContent).toContain('File too large');
    expect(el.querySelector('button[aria-label="Remove"]')).toBeTruthy();
    expect(el.querySelector('button[aria-label="Retry"]')).toBeFalsy();

    let removed = false;
    fixture.componentInstance.cancel.subscribe(() => (removed = true));
    (el.querySelector('button[aria-label="Remove"]') as HTMLButtonElement).click();
    expect(removed).toBe(true);
  });

  it('shows a Retry action for an errored entry that can be retried, and emits retry when clicked', async () => {
    const fixture = create({ filename: 'huge.png', status: 'error', detail: 'Cancelled — shared upload', canRetry: true });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const retryButton = el.querySelector('button[aria-label="Retry"]') as HTMLButtonElement;
    expect(retryButton).toBeTruthy();

    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    retryButton.click();
    expect(retried).toBe(true);

    // Remove must still be available alongside Retry.
    expect(el.querySelector('button[aria-label="Remove"]')).toBeTruthy();
  });
});
