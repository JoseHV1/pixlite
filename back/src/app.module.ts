import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImagesModule } from './images/images.module';
import { AllExceptionsFilter } from './notifications/discord-exception.filter';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [ImagesModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
