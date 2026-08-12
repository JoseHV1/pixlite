import { Module } from '@nestjs/common';
import { ClientErrorController } from './client-error.controller';
import { VisitController } from './visit.controller';
import { DiscordNotifierService } from './discord-notifier.service';

@Module({
  controllers: [ClientErrorController, VisitController],
  providers: [DiscordNotifierService],
  exports: [DiscordNotifierService],
})
export class NotificationsModule {}
