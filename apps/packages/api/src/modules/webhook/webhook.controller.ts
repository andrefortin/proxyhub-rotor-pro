import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotifyService } from '../notify/notify.service';

@ApiTags('webhooks', 'mcp-tool')
@ApiBearerAuth()
@Controller('v1/webhooks')
export class WebhookController {
  constructor(private notify: NotifyService) {}

  @Post()
  @ApiOperation({ summary: 'Send test event to webhooks (or handle incoming webhook)' })
  @ApiBody({ schema: {
    properties: { event: { type: 'string', enum: ['test', 'custom'] }, payload: { type: 'object', additionalProperties: true } }
    }})
  @ApiResponse({ status: 200, description: 'Webhook processed', schema: { properties: { ok: { type: 'boolean' } } } })
  async handle(@Body() body: any) {
    const { event = 'custom', payload = {} } = body || {};
    await this.notify.broadcast(event, payload);
    return { ok: true };
  }
}
