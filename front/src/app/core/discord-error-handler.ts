import { ErrorHandler, Injectable } from '@angular/core';
import { API_BASE_URL } from './api-config';

/**
 * Forwards uncaught errors to the backend's /client-error endpoint, which
 * relays them to Discord. The webhook URL never touches the browser bundle.
 * Paired with provideBrowserGlobalErrorListeners() in app.config.ts, this
 * also catches errors outside the Angular zone (window.onerror, unhandled
 * promise rejections).
 */
@Injectable()
export class DiscordErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    console.error(error);

    const err = error as { message?: string; stack?: string } | undefined;

    fetch(`${API_BASE_URL}/client-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: (err?.message ?? String(error)).slice(0, 2000),
        stack: err?.stack?.slice(0, 4000),
        url: window.location.href,
      }),
    }).catch(() => {});
  }
}
