import { Controller, Get, Query } from "@nestjs/common";
import { ProvidersService } from "./providers.service";

@Controller("v1/providers")
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  @Get()
  async list(@Query() q: any) {
    // Simple list without advanced filters for now, matching original findAll
    return await this.service.findAll(); // Use service which includes logoUrl
  }
}
