import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        config: true,
        logoUrl: true,
      },
    });
  }

  async create(data: {
    name: string;
    type: string;
    config: any;
    logoUrl?: string;
  }) {
    return this.prisma.provider.create({
      data: {
        name: data.name,
        type: data.type as any,
        config: data.config,
        logoUrl: data.logoUrl,
      },
    });
  }

  async update(id: string, data: { active: boolean }) {
    const { active } = data;
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.update({
        where: { id },
        data: { active },
      });

      await tx.proxy.updateMany({
        where: { providerId: id },
        data: { disabled: !active },
      });

      return provider;
    });
  }
}
