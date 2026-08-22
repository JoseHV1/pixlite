import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RateLimiter } from '../common/rate-limiter';
import { DiscordNotifierService } from './discord-notifier.service';

interface VisitBody {
  site?: string;
  url?: string;
  referer?: string;
}

const ALLOWED_SITES = ['pixlite', 'markconverted', 'portfolio'];

/**
 * Shared visit-ping relay for the whole personal-projects group — lets any
 * of the frontends (including static ones with no backend of their own,
 * like the portfolio) report a page load without ever holding the Discord
 * webhook URL themselves. See client-error.controller.ts for the sibling
 * error-reporting endpoint this mirrors.
 */
@Controller('visit')
export class VisitController {
  private readonly rateLimiter = new RateLimiter(60_000, 20);

  constructor(private readonly notifier: DiscordNotifierService) {}

  @Post()
  async report(@Body() body: VisitBody, @Req() req: Request): Promise<{ reported: boolean }> {
    this.rateLimiter.enforce(req.ip ?? 'unknown');

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
}
