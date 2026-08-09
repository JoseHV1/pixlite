import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImageQueue, MAX_FILES_PER_BATCH } from './image-queue';
import { API_BASE_URL } from './api-config';

describe('ImageQueue', () => {
  let queue: ImageQueue;
  let httpMock: HttpTestingController;
  const endpoint = `${API_BASE_URL}/images/compress`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageQueue, provideHttpClient(), provideHttpClientTesting()],
    });
    queue = TestBed.inject(ImageQueue);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function file(name: string, size = 10) {
    return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
  }

  it('adds files as compressing and moves them to done on a successful response', () => {
    queue.addFiles([file('beach.jpg', 2_400_000)], { quality: 80, format: 'original' });

    expect(queue.entries()).toHaveLength(1);
    expect(queue.entries()[0].status).toBe('compressing');
    expect(queue.entries()[0].filename).toBe('beach.jpg');

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    req.flush({
      results: [
        {
          filename: 'beach.jpg',
          mimeType: 'image/jpeg',
          originalSize: 2_400_000,
          compressedSize: 840_000,
          dataUrl: 'data:image/jpeg;base64,AAA',
          error: null,
        },
      ],
    });

    const [entry] = queue.entries();
    expect(entry.status).toBe('done');
    expect(entry.compressedSize).toBe(840_000);
    expect(entry.dataUrl).toBe('data:image/jpeg;base64,AAA');
  });

  it('marks matching entries as error when the request itself fails', () => {
    queue.addFiles([file('broken.png')], { quality: 80, format: 'original' });

    const req = httpMock.expectOne(endpoint);
    req.flush({ message: 'File too large' }, { status: 413, statusText: 'Payload Too Large' });

    const [entry] = queue.entries();
    expect(entry.status).toBe('error');
    expect(entry.errorMessage).toBe('File too large');
  });

  it('isolates a per-file error in a batch response instead of failing every entry', () => {
    queue.addFiles([file('good.jpg'), file('bad.jpg')], { quality: 80, format: 'original' });
    const [good, bad] = queue.entries();

    httpMock.expectOne(endpoint).flush({
      results: [
        { filename: 'good.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:x', error: null },
        { filename: 'bad.jpg', mimeType: null, originalSize: 10, compressedSize: null, dataUrl: null, error: 'Corrupted file' },
      ],
    });

    expect(queue.entries().find((e) => e.id === good.id)?.status).toBe('done');
    const badEntry = queue.entries().find((e) => e.id === bad.id);
    expect(badEntry?.status).toBe('error');
    expect(badEntry?.errorMessage).toBe('Corrupted file');
  });

  it('caps a batch at MAX_FILES_PER_BATCH and visibly flags the skipped files', () => {
    const files = Array.from({ length: MAX_FILES_PER_BATCH + 5 }, (_, i) => file(`img-${i}.jpg`));
    queue.addFiles(files, { quality: 80, format: 'original' });

    const entries = queue.entries();
    expect(entries).toHaveLength(MAX_FILES_PER_BATCH + 1);
    expect(entries.filter((e) => e.status === 'compressing')).toHaveLength(MAX_FILES_PER_BATCH);
    const notice = entries[entries.length - 1];
    expect(notice.status).toBe('error');
    expect(notice.errorMessage).toContain('20');

    httpMock.expectOne(endpoint).flush({ results: files.slice(0, MAX_FILES_PER_BATCH).map(() => ({ filename: 'x', mimeType: 'image/jpeg', originalSize: 1, compressedSize: 1, dataUrl: 'data:x', error: null })) });
  });

  it('removeEntry cancels the underlying HTTP request', () => {
    queue.addFiles([file('a.jpg')], { quality: 80, format: 'original' });
    const [entry] = queue.entries();

    const req = httpMock.expectOne(endpoint);
    queue.removeEntry(entry.id);

    expect(req.cancelled).toBe(true);
    expect(queue.entries()).toHaveLength(0);
  });

  it('removeEntry on one file in a shared batch errors its siblings instead of leaving them frozen', () => {
    queue.addFiles([file('a.jpg'), file('b.jpg')], { quality: 80, format: 'original' });
    const [a, b] = queue.entries();

    const req = httpMock.expectOne(endpoint);
    queue.removeEntry(a.id);

    expect(req.cancelled).toBe(true);
    const sibling = queue.entries().find((e) => e.id === b.id);
    expect(sibling?.status).toBe('error');
    expect(sibling?.errorMessage).toContain('shared an upload');
  });

  it('downloadEntry triggers a download only once the file is done', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    queue.addFiles([file('logo.svg')], { quality: 80, format: 'original' });
    queue.downloadEntry(queue.entries()[0].id);
    expect(clickSpy).not.toHaveBeenCalled();

    httpMock.expectOne(endpoint).flush({
      results: [
        {
          filename: 'logo.svg',
          mimeType: 'image/svg+xml',
          originalSize: 45_000,
          compressedSize: 12_000,
          dataUrl: 'data:image/svg+xml;base64,AAA',
          error: null,
        },
      ],
    });

    queue.downloadEntry(queue.entries()[0].id);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
