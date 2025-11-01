import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  async getSettings() {
    const settings = await this.prisma.appSettings.findMany();
    const settingsObj: any = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    return settingsObj;
  }

  async getSetting(key: string) {
    const setting = await this.prisma.appSettings.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async updateSettings(settings: Record<string, any>) {
    const updates = Object.entries(settings).map(([key, value]) =>
      this.prisma.appSettings.upsert({
        where: { key },
        create: { key, value },
        update: { value, updatedAt: new Date() },
      })
    );
    await Promise.all(updates);
    return this.getSettings();
  }
}
