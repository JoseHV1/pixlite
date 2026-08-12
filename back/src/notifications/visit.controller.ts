import { BadRequestException, Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DiscordNotifierService } from './discord-notifier.service';

interface VisitBody {
  site?: string;
  url?: string;
  referer?: string;
}

const ALLOWED_SITES = ['pixlite', 'markconverted', 'portfolio'];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

/**
 * Shared visit-ping relay for the whole personal-projects group — lets any
 * of the frontends (including static ones with no backend of their own,
 * like the portfolio) report a page load without ever holding the Discord
 * webhook URL themselves. See client-error.controller.ts for the sibling
 * error-reporting endpoint this mirrors.
 */
@Controller('visit')
export class VisitController {
  private readonly requestTimestampsByIp = new Map<string, number[]>();

  constructor(private readonly notifier: DiscordNotifierService) {}

  @Post()
  async report(@Body() body: VisitBody, @Req() req: Request): Promise<{ reported: boolean }> {
    this.enforceRateLimit(req.ip ?? 'unknown');

    if (!body?.site || !ALLOWED_SITES.includes(body.site)) {
      throw new BadRequestException(`site must be one of: ${ALLOWED_SITES.join(', ')}`);
    }

    await this.notifier.notifyVisit({
      site: body.site,
      url: body.url?.slice(0, 2048) ?? req.headers.referer,
      referer: req.headers.referer,
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
