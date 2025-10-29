import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('config')
  async getAll() {
    return { items: await this.service.getAll() };
  }

  @Patch(':method')
  async update(
    @Param('method') method: string,
    @Body() data: { enabled: boolean; config: any; eventTypes: string[] }
  ) {
    return await this.service.update(method, data);
  }
}