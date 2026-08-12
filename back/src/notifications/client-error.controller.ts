import { BadRequestException, Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DiscordNotifierService } from './discord-notifier.service';

interface ClientErrorBody {
  message?: string;
  stack?: string;
  url?: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Lets the Angular frontend report uncaught errors without ever holding the
 * Discord webhook URL itself — the browser posts here, this relays server-side.
 */
@Controller('client-error')
export class ClientErrorController {
  private readonly requestTimestampsByIp = new Map<string, number[]>();

  constructor(private readonly notifier: DiscordNotifierService) {}

  @Post()
  async report(@Body() body: ClientErrorBody, @Req() req: Request): Promise<{ reported: boolean }> {
    this.enforceRateLimit(req.ip ?? 'unknown');

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

  private enforceRateLimit(ip: string): void {
    const now = Date.now();
    const timestamps = (this.requestTimestampsByIp.get(ip) ?? []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    );

    if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    timestamps.push(now);
    this.requestTimestampsByIp.set(ip, timestamps);
  }
}
