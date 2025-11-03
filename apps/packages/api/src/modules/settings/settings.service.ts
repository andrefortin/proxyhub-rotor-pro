import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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
