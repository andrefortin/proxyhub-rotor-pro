import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get all notification configurations' })
  @ApiResponse({ status: 200, description: 'Notification configurations' })
  async getAll() {
    return { items: await this.service.getAll() };
  }

  @Patch(':method')
  @ApiOperation({ summary: 'Update notification method configuration' })
  @ApiParam({ name: 'method', enum: ['discord', 'telegram', 'webhook'] })
  @ApiBody({ schema: {
    properties: {
      enabled: { type: 'boolean' },
      config: { type: 'object' },
      eventTypes: { type: 'array', items: { type: 'string' } }
    }
  }})
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async update(
    @Param('method') method: string,
    @Body() data: { enabled: boolean; config: any; eventTypes: string[] }
  ) {
    return await this.service.update(method, data);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent notification logs' })
  @ApiResponse({ status: 200, description: 'Notification logs' })
  async getLogs() {
    return { items: await this.service.getRecentLogs() };
  }
}