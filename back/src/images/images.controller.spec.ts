import { BadRequestException } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  let service: ImagesService;

  beforeEach(() => {
    service = new ImagesService();
    controller = new ImagesController(service);
  });

  it('rejects a request with no files', async () => {
    await expect(controller.compress([], '80', 'original')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unsupported output format before touching the service', async () => {
    const file = { originalname: 'a.png', mimetype: 'image/png', size: 10, buffer: Buffer.alloc(10) } as Express.Multer.File;
    await expect(controller.compress([file], '80', 'gif')).rejects.toBeInstanceOf(BadRequestException);
  });
});
