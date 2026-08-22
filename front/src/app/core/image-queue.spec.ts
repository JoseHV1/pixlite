import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import JSZip from 'jszip';
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

  it('retryEntry recovers a sibling collaterally errored by cancelling another file in the same batch', () => {
    queue.addFiles([file('a.jpg'), file('b.jpg')], { quality: 80, format: 'original' });
    const [a, b] = queue.entries();

    const firstReq = httpMock.expectOne(endpoint);
    queue.removeEntry(a.id);
    expect(firstReq.cancelled).toBe(true);
    expect(queue.entries().find((e) => e.id === b.id)?.status).toBe('error');

    queue.retryEntry(b.id);
    expect(queue.entries().find((e) => e.id === b.id)?.status).toBe('compressing');

    const retryReq = httpMock.expectOne(endpoint);
    expect(retryReq.request.body.getAll('files')).toHaveLength(1);
    retryReq.flush({
      results: [{ filename: 'b.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 6, dataUrl: 'data:x', error: null }],
    });

    const recovered = queue.entries().find((e) => e.id === b.id);
    expect(recovered?.status).toBe('done');
    expect(recovered?.compressedSize).toBe(6);
  });

  it('retryEntry does nothing for an entry that is not in an error state', () => {
    queue.addFiles([file('a.jpg')], { quality: 80, format: 'original' });
    const [entry] = queue.entries();
    expect(entry.status).toBe('compressing');

    queue.retryEntry(entry.id);
    expect(queue.entries()[0].status).toBe('compressing');

    // Still just the one original request outstanding — retryEntry fired nothing new.
    httpMock.expectOne(endpoint).flush({
      results: [{ filename: 'a.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:x', error: null }],
    });
  });

  it('retryEntry does nothing for the "files skipped" notice entry (no underlying file)', () => {
    const files = Array.from({ length: MAX_FILES_PER_BATCH + 1 }, (_, i) => file(`img-${i}.jpg`));
    queue.addFiles(files, { quality: 80, format: 'original' });
    const notice = queue.entries()[queue.entries().length - 1];
    expect(notice.status).toBe('error');

    queue.retryEntry(notice.id);
    expect(queue.entries().find((e) => e.id === notice.id)?.status).toBe('error');

    // The original batch request is still the only one outstanding.
    httpMock.expectOne(endpoint).flush({
      results: files.slice(0, MAX_FILES_PER_BATCH).map(() => ({
        filename: 'x',
        mimeType: 'image/jpeg',
        originalSize: 1,
        compressedSize: 1,
        dataUrl: 'data:x',
        error: null,
      })),
    });
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

  it('downloadAllAsZip does nothing when no entry is done yet', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    queue.addFiles([file('a.jpg')], { quality: 80, format: 'original' });
    await queue.downloadAllAsZip();
    expect(clickSpy).not.toHaveBeenCalled();

    httpMock.expectOne(endpoint).flush({
      results: [{ filename: 'a.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:x;base64,QQ==', error: null }],
    });
    clickSpy.mockRestore();
  });

  it('downloadAllAsZip sets zipError instead of throwing when zip generation fails', async () => {
    const generateSpy = vi.spyOn(JSZip.prototype, 'generateAsync').mockRejectedValue(new Error('boom'));

    queue.addFiles([file('a.jpg')], { quality: 80, format: 'original' });
    httpMock.expectOne(endpoint).flush({
      results: [{ filename: 'a.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:image/jpeg;base64,QUJD', error: null }],
    });

    expect(queue.zipError()).toBeNull();
    await expect(queue.downloadAllAsZip()).resolves.toBeUndefined();
    expect(queue.zipError()).toContain('Could not create the .zip file');

    generateSpy.mockRestore();
  });

  it('downloadAllAsZip bundles every done entry into one zip and de-duplicates repeated filenames', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let capturedBlob: Blob | undefined;
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((obj: Blob | MediaSource) => {
        capturedBlob = obj as Blob;
        return 'blob:fake';
      });
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    queue.addFiles([file('a.jpg'), file('a.jpg')], { quality: 80, format: 'original' });
    httpMock.expectOne(endpoint).flush({
      results: [
        { filename: 'a.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:image/jpeg;base64,QUJD', error: null },
        { filename: 'a.jpg', mimeType: 'image/jpeg', originalSize: 10, compressedSize: 5, dataUrl: 'data:image/jpeg;base64,REVG', error: null },
      ],
    });

    await queue.downloadAllAsZip();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(capturedBlob).toBeDefined();

    const zip = await JSZip.loadAsync(capturedBlob!);
    expect(Object.keys(zip.files).sort()).toEqual(['a (2).jpg', 'a.jpg']);

    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
