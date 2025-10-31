import {
  Controller,
  Body,
  Delete,
  Get,
  Patch,
  Post,
  Param,
} from "@nestjs/common";
import { ProviderService } from "./provider.service";

@Controller("v1/provider")
export class ProviderController {
  constructor(private service: ProviderService) {}

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
    return await this.service.createProvider(data);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return await this.service.findById(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: { active: boolean }) {
    return await this.service.updateProvider(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    const success = await this.service.deleteProvider(id);
    if (!success) {
      throw new Error("Delete failed");
    }
    return { success: true, message: "Provider deleted" };
  }

  @Post(":id/import")
  async importProxies(@Param("id") id: string) {
    return await this.service.triggerImport(id);
  }
}
