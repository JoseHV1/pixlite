import { BadRequestException, Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImagesService, MAX_FILE_SIZE, OUTPUT_FORMATS } from './images.service';
import type { OutputFormat } from './images.service';

const MAX_FILES = 20;

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('compress')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, { storage: memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async compress(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('quality') quality?: string,
    @Body('format') format?: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files were uploaded.');
    }
    if (format !== undefined && !OUTPUT_FORMATS.includes(format as OutputFormat)) {
      throw new BadRequestException(`Unsupported output format: ${format}`);
    }

    const results = await this.imagesService.compressMany(files, {
      quality: Number(quality),
      format: (format as OutputFormat | undefined) ?? 'original',
    });
    return { results };
  }
}
