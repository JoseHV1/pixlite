import { TestBed } from '@angular/core/testing';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders an accessible status element at the requested size', async () => {
    const fixture = TestBed.createComponent(Spinner);
    fixture.componentRef.setInput('size', 32);
    fixture.componentRef.setInput('label', 'Zipping');
    await fixture.whenStable();
    const el = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Zipping');
    expect(el.style.width).toBe('32px');
  });
});
