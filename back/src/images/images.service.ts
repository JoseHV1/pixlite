import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp';
export const OUTPUT_FORMATS: OutputFormat[] = ['original', 'jpeg', 'png', 'webp'];

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

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

const MIME_TO_FORMAT: Record<string, Exclude<OutputFormat, 'original'>> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ImagesService {
  async compressOne(file: Express.Multer.File, options: CompressOptions): Promise<CompressedImageResult> {
    if (!MIME_TO_FORMAT[file.mimetype]) {
      return this.failure(file, `Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      return this.failure(file, 'File is larger than the 50MB limit.');
    }

    const quality = normalizeQuality(options.quality);
    const format = options.format === 'original' ? MIME_TO_FORMAT[file.mimetype] : options.format;

    try {
      const buffer = await sharp(file.buffer).toFormat(format, { quality }).toBuffer();
      return {
        filename: file.originalname,
        mimeType: `image/${format}`,
        originalSize: file.size,
        compressedSize: buffer.length,
        dataUrl: `data:image/${format};base64,${buffer.toString('base64')}`,
        error: null,
      };
    } catch {
      return this.failure(file, 'This file could not be processed — it may be corrupted or unsupported.');
    }
  }

  compressMany(files: Express.Multer.File[], options: CompressOptions): Promise<CompressedImageResult[]> {
    // compressOne never rejects (it catches its own errors), so one bad file
    // can't fail the whole batch here.
    return Promise.all(files.map((file) => this.compressOne(file, options)));
  }

  private failure(file: Express.Multer.File, error: string): CompressedImageResult {
    return { filename: file.originalname, mimeType: null, originalSize: file.size, compressedSize: null, dataUrl: null, error };
  }
}

export function normalizeQuality(quality: unknown): number {
  const parsed = Number(quality);
  if (!Number.isFinite(parsed)) return 80;
  return Math.min(100, Math.max(1, Math.round(parsed)));
}
