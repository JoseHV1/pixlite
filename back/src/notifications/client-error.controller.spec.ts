import { BadRequestException, HttpException } from '@nestjs/common';
import { ClientErrorController } from './client-error.controller';
import { DiscordNotifierService } from './discord-notifier.service';

function makeRequest(ip: string) {
  return { ip, headers: {} } as never;
}

describe('ClientErrorController', () => {
  let controller: ClientErrorController;
  let notifier: DiscordNotifierService;

  beforeEach(() => {
    notifier = new DiscordNotifierService();
    controller = new ClientErrorController(notifier);
  });

  it('rejects a missing message', async () => {
    await expect(controller.report({}, makeRequest('1.1.1.1'))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-string message', async () => {
    await expect(
      controller.report({ message: 42 as unknown as string }, makeRequest('1.1.1.1')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a valid report', async () => {
    await expect(
      controller.report({ message: 'boom', stack: 'at x()', url: 'https://pixlite.example/' }, makeRequest('1.1.1.1')),
    ).resolves.toEqual({ reported: true });
  });

  it('rate-limits a single IP after 10 requests within the window', async () => {
    for (let i = 0; i < 10; i++) {
      await controller.report({ message: 'boom' }, makeRequest('9.9.9.9'));
    }
    await expect(controller.report({ message: 'boom' }, makeRequest('9.9.9.9'))).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
