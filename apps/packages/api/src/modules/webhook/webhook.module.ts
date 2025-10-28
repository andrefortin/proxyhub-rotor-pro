import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { NotifyModule } from '../notify/notify.module';
@Module({ imports: [NotifyModule], controllers: [WebhookController] })
export class WebhookModule {}
