import { BadRequestException, HttpException } from '@nestjs/common';
import { VisitController } from './visit.controller';
import { DiscordNotifierService } from './discord-notifier.service';

function makeRequest(ip: string) {
  return { ip, headers: {} } as never;
}

describe('VisitController', () => {
  let controller: VisitController;
  let notifier: DiscordNotifierService;

  beforeEach(() => {
    notifier = new DiscordNotifierService();
    controller = new VisitController(notifier);
  });

  it('rejects a site outside the allowed list', async () => {
    await expect(controller.report({ site: 'not-mine' }, makeRequest('1.1.1.1'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a missing site', async () => {
    await expect(controller.report({}, makeRequest('1.1.1.1'))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts every allowed site', async () => {
    for (const site of ['pixlite', 'markconverted', 'portfolio']) {
      await expect(controller.report({ site }, makeRequest('1.1.1.1'))).resolves.toEqual({ reported: true });
    }
  });

  it('rate-limits a single IP after 20 requests within the window', async () => {
    for (let i = 0; i < 20; i++) {
      await controller.report({ site: 'pixlite' }, makeRequest('9.9.9.9'));
    }
    await expect(controller.report({ site: 'pixlite' }, makeRequest('9.9.9.9'))).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('tracks separate IPs independently', async () => {
    for (let i = 0; i < 20; i++) {
      await controller.report({ site: 'pixlite' }, makeRequest('8.8.8.8'));
    }
    await expect(controller.report({ site: 'pixlite' }, makeRequest('7.7.7.7'))).resolves.toEqual({
      reported: true,
    });
  });
});
