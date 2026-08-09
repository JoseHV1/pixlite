import { Component, input, output, signal } from '@angular/core';

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
    this.emitFiles(input.files);
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
    this.emitFiles(event.dataTransfer?.files ?? null);
  }

  private emitFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;
    this.filesSelected.emit(Array.from(fileList));
  }
}
