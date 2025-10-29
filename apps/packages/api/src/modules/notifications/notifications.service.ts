import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return (this.prisma as any).notificationConfig.findMany({
      orderBy: { method: 'asc' }
    });
  }

  async getByMethod(method: string) {
    return (this.prisma as any).notificationConfig.findUnique({
      where: { method }
    }) || { id: method, method, enabled: false, config: {}, eventTypes: [] };
  }

  async update(method: string, data: { enabled: boolean; config: any; eventTypes: string[] }) {
    const existing = await (this.prisma as any).notificationConfig.findUnique({ where: { method } });
    if (existing) {
      return (this.prisma as any).notificationConfig.update({
        where: { id: existing.id },
        data
      });
    } else {
      return (this.prisma as any).notificationConfig.create({
        data: {
          method,
          ...data
        }
      });
    }
  }
}