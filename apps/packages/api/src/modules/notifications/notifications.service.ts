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

  async getRecentLogs(): Promise<any[]> {
    const fs = require('fs').promises;
    const path = '/logs/notifications.json';
    try {
      const data = await fs.readFile(path, 'utf8');
      const lines = data.split('\n').filter(line => line.trim());
      const last50 = lines.slice(-50).map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(entry => entry !== null);
      return last50;
    } catch (error) {
      console.error('Error reading notifications logs:', error);
      return [];
    }
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