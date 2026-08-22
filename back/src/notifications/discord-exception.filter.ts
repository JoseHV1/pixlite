import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request, Response } from 'express';
import { DiscordNotifierService } from './discord-notifier.service';

/**
 * Global catch-all filter. Reports every unhandled 5xx to Discord while
 * preserving Nest's default HTTP response behavior for the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly notifier: DiscordNotifierService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = exception as Error;

    if (statusCode >= 500) {
      void this.notifier.notifyError({
        message: error?.message || 'Internal server error',
        url: httpAdapter.getRequestUrl(request) as string,
        method: httpAdapter.getRequestMethod(request) as string,
        statusCode,
        stack: error?.stack,
      });
    }

    const responseBody = isHttpException
      ? exception.getResponse()
      : { statusCode, message: 'Internal server error' };

    httpAdapter.reply(response, responseBody, statusCode);
  }
}
