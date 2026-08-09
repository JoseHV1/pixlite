import { EntryDetailPipe } from './entry-detail.pipe';
import { QueueEntry } from '../core/image-queue';

function entry(overrides: Partial<QueueEntry>): QueueEntry {
  return {
    id: '1',
    filename: 'x.jpg',
    originalSize: 1000,
    status: 'done',
    percent: null,
    compressedSize: null,
    dataUrl: null,
    errorMessage: null,
    ...overrides,
  };
}

describe('EntryDetailPipe', () => {
  const pipe = new EntryDetailPipe();

  it('shows a negative percentage when the file shrank', () => {
    const text = pipe.transform(entry({ status: 'done', originalSize: 1000, compressedSize: 500 }));
    expect(text).toContain('(-50%)');
  });

  it('shows a positive percentage instead of a double negative when the file grew', () => {
    const text = pipe.transform(entry({ status: 'done', originalSize: 100, compressedSize: 150 }));
    expect(text).toContain('(+50%)');
    expect(text).not.toContain('--');
  });

  it('omits the percentage when the original size is zero to avoid a division by zero', () => {
    const text = pipe.transform(entry({ status: 'done', originalSize: 0, compressedSize: 0 }));
    expect(text).not.toContain('%');
    expect(text).not.toContain('NaN');
  });

  it('shows the upload size while compressing', () => {
    const text = pipe.transform(entry({ status: 'compressing', originalSize: 2048 }));
    expect(text).toContain('2 KB');
  });

  it('shows the error message when errored', () => {
    const text = pipe.transform(entry({ status: 'error', errorMessage: 'File too large' }));
    expect(text).toBe('File too large');
  });
});
