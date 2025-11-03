import { Injectable } from "@nestjs/common";
import { Prisma, Provider } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  validatePagination,
  PaginatedResponse,
  PaginationParams,
} from "../../common/pagination"; // Assuming this path is correct

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    params?: PaginationParams,
    search?: string,
    mock?: boolean
  ): Promise<PaginatedResponse<any>> {
    const { skip, take, page, limit } = validatePagination(params);

    if (mock) {
      const mockProviders = [
        {
          id: "mock-1",
          name: "IPRoyal API",
          type: "api",
          active: true,
          logoUrl: "https://iproyal.com/static/favicons/apple-touch-icon.png",
          config: { kind: "iproyal", access_token: "mock_token" },
        },
        {
          id: "mock-2",
          name: "File Import",
          type: "file",
          active: false,
          logoUrl: null,
          config: { path: "/path/to/proxies.txt" },
        },
        {
          id: "mock-3",
          name: "Manual Provider",
          type: "manual",
          active: true,
          logoUrl: null,
          config: {},
        },
      ];
      const filteredMock = search
        ? mockProviders.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
          )
        : mockProviders;
      const total = filteredMock.length;
      const items = filteredMock.slice(skip, skip + take);
      return { items, total, page, limit };
    }

    const where = search
      ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
      : {};
    const total = await this.prisma.provider.count({ where });
    const items = await this.prisma.provider.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        config: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { items, total, page, limit };
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const { active } = data;
    if (typeof active === "boolean") {
      await this.prisma.proxy.updateMany({
        where: { providerId: id },
        data: { disabled: !active },
      });
    }
    return this.prisma.provider.update({ where: { id }, data });
  }
}
