import { BadRequestException, HttpException } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

function makeRequest(ip: string) {
  return { ip } as never;
}

describe('ImagesController', () => {
  let controller: ImagesController;
  let service: ImagesService;

  beforeEach(() => {
    service = new ImagesService();
    controller = new ImagesController(service);
  });

  it('rejects a request with no files', async () => {
    await expect(controller.compress([], makeRequest('1.1.1.1'), '80', 'original')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an unsupported output format before touching the service', async () => {
    const file = { originalname: 'a.png', mimetype: 'image/png', size: 10, buffer: Buffer.alloc(10) } as Express.Multer.File;
    await expect(controller.compress([file], makeRequest('1.1.1.1'), '80', 'gif')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rate-limits a single IP after 10 requests within the window', async () => {
    for (let i = 0; i < 10; i++) {
      await controller.compress([], makeRequest('9.9.9.9'), '80', 'original').catch(() => {});
    }
    await expect(controller.compress([], makeRequest('9.9.9.9'), '80', 'original')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('tracks separate IPs independently', async () => {
    for (let i = 0; i < 10; i++) {
      await controller.compress([], makeRequest('8.8.8.8'), '80', 'original').catch(() => {});
    }
    await expect(controller.compress([], makeRequest('7.7.7.7'), '80', 'original')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
