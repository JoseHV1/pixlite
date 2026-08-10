import { ImagesService, normalizeQuality } from './images.service';

const SAMPLE_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = overrides.buffer ?? Buffer.from(SAMPLE_PNG_BASE64, 'base64');
  return {
    fieldname: 'files',
    originalname: 'sample.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
    buffer,
  };
}

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(() => {
    service = new ImagesService();
  });

  it('compresses a valid file and reports a smaller-or-equal size with no error', async () => {
    const result = await service.compressOne(makeFile(), { quality: 80, format: 'original' });
    expect(result.error).toBeNull();
    expect(result.mimeType).toBe('image/png');
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('treats quality 0 as a valid value clamped to 1, not as absent', () => {
    expect(normalizeQuality(0)).toBe(1);
  });

  it('clamps out-of-range quality values into [1, 100]', () => {
    expect(normalizeQuality(-5)).toBe(1);
    expect(normalizeQuality(150)).toBe(100);
    expect(normalizeQuality(55.7)).toBe(56);
  });

  it('defaults to 80 only for genuinely missing/invalid quality', () => {
    expect(normalizeQuality(undefined)).toBe(80);
    expect(normalizeQuality(NaN)).toBe(80);
    expect(normalizeQuality('not-a-number')).toBe(80);
  });

  it('actually applies the normalized quality when compressing (quality=0 does not silently become 80)', async () => {
    const result = await service.compressOne(makeFile(), { quality: 0, format: 'jpeg' });
    expect(result.error).toBeNull();
  });

  it('converts to the requested output format', async () => {
    const result = await service.compressOne(makeFile(), { quality: 80, format: 'webp' });
    expect(result.mimeType).toBe('image/webp');
    expect(result.dataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it('returns a per-file error for an unsupported mime type instead of throwing', async () => {
    const result = await service.compressOne(makeFile({ mimetype: 'application/pdf' }), {
      quality: 80,
      format: 'original',
    });
    expect(result.error).toContain('Unsupported file type');
    expect(result.dataUrl).toBeNull();
  });

  it('returns a per-file error for an oversized file instead of throwing', async () => {
    const bigBuffer = Buffer.alloc(51 * 1024 * 1024);
    const result = await service.compressOne(makeFile({ buffer: bigBuffer, size: bigBuffer.length }), {
      quality: 80,
      format: 'original',
    });
    expect(result.error).toContain('50MB');
  });

  it('returns a per-file error for corrupted image data instead of throwing', async () => {
    const garbage = Buffer.from('this is not an image');
    const result = await service.compressOne(makeFile({ buffer: garbage, size: garbage.length }), {
      quality: 80,
      format: 'original',
    });
    expect(result.error).toBeTruthy();
    expect(result.dataUrl).toBeNull();
  });

  it('isolates a bad file in a batch so the good ones still succeed', async () => {
    const good = makeFile({ originalname: 'good.png' });
    const bad = makeFile({ originalname: 'bad.pdf', mimetype: 'application/pdf' });

    const results = await service.compressMany([good, bad], { quality: 80, format: 'original' });

    expect(results).toHaveLength(2);
    expect(results[0].error).toBeNull();
    expect(results[0].filename).toBe('good.png');
    expect(results[1].error).toContain('Unsupported file type');
    expect(results[1].filename).toBe('bad.pdf');
  });
});
