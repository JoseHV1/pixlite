import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { DiscordErrorHandler } from './core/discord-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The default XHR backend is required (not withFetch()) — Angular's Fetch
    // backend does not emit HttpEventType.UploadProgress, which ImageQueue relies on.
    provideHttpClient(),
    { provide: ErrorHandler, useClass: DiscordErrorHandler }
  ]
};
