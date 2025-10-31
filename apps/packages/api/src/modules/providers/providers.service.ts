import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import {
  validatePagination,
  PaginatedResponse,
  PaginationParams,
} from "../../common/pagination";

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaClient) {}

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
          config: { kind: "iproyal", access_token: "mock_token" },
          logoUrl: "https://example.com/logo.png",
        },
        {
          id: "mock-2",
          name: "File Import",
          type: "file",
          active: false,
          config: { path: "/path/to/proxies.txt" },
          logoUrl: null,
        },
        {
          id: "mock-3",
          name: "Manual Provider",
          type: "manual",
          active: true,
          config: {},
          logoUrl: null,
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
}
