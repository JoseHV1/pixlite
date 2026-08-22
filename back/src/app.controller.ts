import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RateLimiter } from './common/rate-limiter';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly rateLimiter = new RateLimiter(60_000, 30);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: Request): string {
    this.rateLimiter.enforce(req.ip ?? 'unknown');
    return this.appService.getHello();
  }
}
