import { Component, HostListener, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-dropzone',
  templateUrl: './dropzone.html',
})
export class Dropzone {
  readonly heading = input('Drag & drop images here');
  readonly hint = input('or click to browse files');
  readonly caption = input('Supports JPG, PNG, WebP up to 50MB');

  readonly filesSelected = output<File[]>();

  readonly isDragOver = signal(false);

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitFiles(input.files ? Array.from(input.files) : []);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.emitFiles(event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : []);
  }

  // Global — an image pasted anywhere on the page should be picked up, not
  // just while the dropzone happens to have focus.
  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      event.preventDefault();
      this.emitFiles(files);
    }
  }

  private emitFiles(files: File[]): void {
    if (files.length === 0) return;
    this.filesSelected.emit(files);
  }
}
