import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DarkPage } from './dark-page';
import { ImageQueue } from '../../core/image-queue';

describe('DarkPage', () => {
  afterEach(() => {
    delete document.documentElement.dataset['theme'];
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarkPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('sets the dark theme on the document', () => {
    TestBed.createComponent(DarkPage);
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('renders the hero and settings panel with no queue yet', async () => {
    const fixture = TestBed.createComponent(DarkPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Optimize Images Instantly');
    expect(text).toContain('Lossy');
    expect(text).not.toContain('Download All');
  });

  it('sends dropped files using the quality selected on the slider', async () => {
    const fixture = TestBed.createComponent(DarkPage);
    await fixture.whenStable();
    const queue = fixture.debugElement.injector.get(ImageQueue);
    const addFiles = vi.spyOn(queue, 'addFiles').mockImplementation(() => {});

    fixture.componentInstance.onQualityChange({ target: { value: '55' } } as unknown as Event);
    const file = new File(['x'], 'texture.png', { type: 'image/png' });
    fixture.componentInstance.onFilesSelected([file]);

    expect(addFiles).toHaveBeenCalledWith([file], { quality: 55, format: 'original' });
  });
});
