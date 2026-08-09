import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfessionalPage } from './professional-page';
import { ImageQueue } from '../../core/image-queue';

describe('ProfessionalPage', () => {
  afterEach(() => {
    delete document.documentElement.dataset['theme'];
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('sets the professional theme on the document', () => {
    TestBed.createComponent(ProfessionalPage);
    expect(document.documentElement.dataset['theme']).toBe('professional');
  });

  it('starts empty, with no queue items or download action', async () => {
    const fixture = TestBed.createComponent(ProfessionalPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Download Optimized Images');
  });

  it('sends dropped files to the queue at a fixed quality with the original format', async () => {
    const fixture = TestBed.createComponent(ProfessionalPage);
    await fixture.whenStable();
    const queue = fixture.debugElement.injector.get(ImageQueue);
    const addFiles = vi.spyOn(queue, 'addFiles').mockImplementation(() => {});

    const file = new File(['x'], 'beach.jpg', { type: 'image/jpeg' });
    fixture.componentInstance.onFilesSelected([file]);

    expect(addFiles).toHaveBeenCalledWith([file], { quality: 80, format: 'original' });
  });
});
