import { Controller, Post, Body } from '@nestjs/common';
import { NotifyService } from '../notify/notify.service';

@Controller('v1/webhooks')
export class WebhookController {
  constructor(private notify: NotifyService) {}
  @Post()
  async handle(@Body() body: any) {
    const { event = 'custom', payload = {} } = body || {};
    await this.notify.broadcast(event, payload);
    return { ok: true };
  }
}
