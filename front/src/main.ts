import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { sendVisitPing } from './app/core/visit-ping';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

sendVisitPing();
