import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp';

export interface CompressOptions {
  quality: number;
  format: OutputFormat;
}

export interface CompressedImageResult {
  filename: string;
  mimeType: string | null;
  originalSize: number;
  compressedSize: number | null;
  dataUrl: string | null;
  error: string | null;
}

export interface CompressResponse {
  results: CompressedImageResult[];
}

@Injectable({ providedIn: 'root' })
export class ImagesApi {
  constructor(private readonly http: HttpClient) {}

  compress(files: File[], options: CompressOptions): Observable<HttpEvent<CompressResponse>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('quality', String(options.quality));
    formData.append('format', options.format);

    const request = new HttpRequest('POST', `${API_BASE_URL}/images/compress`, formData, {
      reportProgress: true,
    });
    return this.http.request<CompressResponse>(request);
  }
}

export function uploadPercent(event: HttpEvent<unknown>): number | null {
  if (event.type === HttpEventType.UploadProgress && event.total) {
    return Math.round((100 * event.loaded) / event.total);
  }
  return null;
}
