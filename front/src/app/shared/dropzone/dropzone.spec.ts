import { TestBed } from '@angular/core/testing';
import { Dropzone } from './dropzone';

describe('Dropzone', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dropzone],
    }).compileComponents();
  });

  it('renders default heading and a hidden file input', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Drag & drop images here');
    expect(el.querySelector('input[type="file"][multiple]')).toBeTruthy();
  });

  it('renders custom heading/hint/caption when provided', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    fixture.componentRef.setInput('heading', 'Custom heading');
    fixture.componentRef.setInput('hint', 'Custom hint');
    fixture.componentRef.setInput('caption', 'Custom caption');
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Custom heading');
    expect(text).toContain('Custom hint');
    expect(text).toContain('Custom caption');
  });

  it('emits filesSelected when a file is chosen via the native input', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    await fixture.whenStable();

    const emitted: File[][] = [];
    fixture.componentInstance.filesSelected.subscribe((files) => emitted.push(files));

    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const fileList = { 0: file, length: 1, item: () => file } as unknown as FileList;
    Object.defineProperty(input, 'files', { value: fileList, configurable: true });
    input.dispatchEvent(new Event('change'));

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].name).toBe('photo.png');
  });

  it('emits filesSelected with an image pasted from the clipboard', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    await fixture.whenStable();

    const emitted: File[][] = [];
    fixture.componentInstance.filesSelected.subscribe((files) => emitted.push(files));

    const file = new File(['x'], 'clipboard.png', { type: 'image/png' });
    const item = { kind: 'file', type: 'image/png', getAsFile: () => file } as unknown as DataTransferItem;
    const event = {
      clipboardData: { items: [item] },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;

    fixture.componentInstance.onPaste(event);

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].name).toBe('clipboard.png');
  });

  it('ignores a paste with no image content', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    await fixture.whenStable();

    const emitted: File[][] = [];
    fixture.componentInstance.filesSelected.subscribe((files) => emitted.push(files));

    const item = { kind: 'string', type: 'text/plain', getAsFile: () => null } as unknown as DataTransferItem;
    const event = { clipboardData: { items: [item] }, preventDefault: () => {} } as unknown as ClipboardEvent;

    fixture.componentInstance.onPaste(event);
    expect(emitted).toHaveLength(0);
  });

  it('toggles the drag-over state on dragover/dragleave/drop', async () => {
    const fixture = TestBed.createComponent(Dropzone);
    await fixture.whenStable();
    const instance = fixture.componentInstance;

    instance.onDragOver({ preventDefault: () => {} } as DragEvent);
    expect(instance.isDragOver()).toBe(true);

    instance.onDragLeave({ preventDefault: () => {} } as DragEvent);
    expect(instance.isDragOver()).toBe(false);

    instance.onDragOver({ preventDefault: () => {} } as DragEvent);
    instance.onDrop({ preventDefault: () => {}, dataTransfer: null } as unknown as DragEvent);
    expect(instance.isDragOver()).toBe(false);
  });

  it('previews staged files and emits fileRemoved without opening the picker', async () => {
    const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));

    const fixture = TestBed.createComponent(Dropzone);
    const files = [
      new File(['x'], 'a.png', { type: 'image/png' }),
      new File(['x'], 'b.png', { type: 'image/png' }),
      new File(['x'], 'c.png', { type: 'image/png' }),
    ];
    fixture.componentRef.setInput('files', files);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('3 images ready');
    expect(el.querySelectorAll('li img')).toHaveLength(3);
    expect(el.textContent).toContain('b.png');

    const removed: number[] = [];
    fixture.componentInstance.fileRemoved.subscribe((index) => removed.push(index));
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    (el.querySelector('button[aria-label="Remove b.png"]') as HTMLButtonElement).dispatchEvent(click);
    expect(removed).toEqual([1]);
    expect(click.defaultPrevented).toBe(true);

    fixture.componentRef.setInput('files', []);
    await fixture.whenStable();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(el.textContent).toContain('Drag & drop images here');
    vi.unstubAllGlobals();
  });
});
