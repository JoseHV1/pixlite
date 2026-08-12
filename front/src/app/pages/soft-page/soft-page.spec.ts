import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SoftPage } from './soft-page';
import { ImageQueue } from '../../core/image-queue';

describe('SoftPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoftPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the bento layout with no queue yet', async () => {
    const fixture = TestBed.createComponent(SoftPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Smart Image Compression');
    expect(text).toContain('Output Format');
    expect(text).toContain('Optimize Now');
  });

  it('stages dropped files without compressing until Optimize Now is clicked', async () => {
    const fixture = TestBed.createComponent(SoftPage);
    await fixture.whenStable();
    const queue = fixture.debugElement.injector.get(ImageQueue);
    const addFiles = vi.spyOn(queue, 'addFiles').mockImplementation(() => {});

    const file = new File(['x'], 'hero.png', { type: 'image/png' });
    fixture.componentInstance.onFilesSelected([file]);
    expect(addFiles).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pendingFiles()).toEqual([file]);

    fixture.componentInstance.format.set('webp');
    fixture.componentInstance.optimizeNow();

    expect(addFiles).toHaveBeenCalledWith([file], {
      quality: 80,
      format: 'webp',
      stripMetadata: true,
      resizeLargeImages: false,
    });
    expect(fixture.componentInstance.pendingFiles()).toEqual([]);
  });

  it('sends the checkbox state through to addFiles', async () => {
    const fixture = TestBed.createComponent(SoftPage);
    await fixture.whenStable();
    const queue = fixture.debugElement.injector.get(ImageQueue);
    const addFiles = vi.spyOn(queue, 'addFiles').mockImplementation(() => {});

    const file = new File(['x'], 'hero.png', { type: 'image/png' });
    fixture.componentInstance.onFilesSelected([file]);
    fixture.componentInstance.stripMetadata.set(false);
    fixture.componentInstance.resizeLargeImages.set(true);
    fixture.componentInstance.optimizeNow();

    expect(addFiles).toHaveBeenCalledWith([file], {
      quality: 80,
      format: 'original',
      stripMetadata: false,
      resizeLargeImages: true,
    });
  });
});
