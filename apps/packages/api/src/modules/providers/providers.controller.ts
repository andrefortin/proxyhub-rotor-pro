import { Controller, Get, Post, Body, Param, Query, Patch } from "@nestjs/common";
import { ProvidersService } from "./providers.service";

@Controller("v1/providers")
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  @Get()
  async list(@Query() q: any) {
    // Simple list without advanced filters for now, matching original findAll
    return await this.service.findAll(); // Use service which includes logoUrl
  }

  @Post()
  async create(
    @Body()
    data: {
      name: string;
      type: "api" | "file" | "manual";
      config: any;
      logoUrl?: string;
    }
  ) {
    return await this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { active: boolean }
  ) {
    return await this.service.update(id, body);
  }
}
