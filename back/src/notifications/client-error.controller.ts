import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RateLimiter } from '../common/rate-limiter';
import { DiscordNotifierService } from './discord-notifier.service';

interface ClientErrorBody {
  message?: string;
  stack?: string;
  url?: string;
}

/**
 * Lets the Angular frontend report uncaught errors without ever holding the
 * Discord webhook URL itself — the browser posts here, this relays server-side.
 */
@Controller('client-error')
export class ClientErrorController {
  private readonly rateLimiter = new RateLimiter(60_000, 10);

  constructor(private readonly notifier: DiscordNotifierService) {}

  @Post()
  async report(@Body() body: ClientErrorBody, @Req() req: Request): Promise<{ reported: boolean }> {
    this.rateLimiter.enforce(req.ip ?? 'unknown');

    if (!body?.message || typeof body.message !== 'string') {
      throw new BadRequestException('message is required');
    }

    await this.notifier.notifyError({
      message: body.message.slice(0, 2000),
      stack: body.stack?.slice(0, 4000),
      url: body.url?.slice(0, 2048) ?? req.headers.referer,
      source: 'frontend',
    });

    return { reported: true };
  }
}
