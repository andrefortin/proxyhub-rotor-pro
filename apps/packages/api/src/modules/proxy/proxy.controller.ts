import {
  Controller,
  Get,
  Query,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  ProxyQueryDto,
  CreateProxyDto,
  PaginatedProxiesDto,
} from "../../dto/proxy.dto";

@Controller("v1/proxy")
export class ProxyController {
  constructor(private service: ProxyService) {}

  @Get()
  async getProxy(@Query() q: any) {
    return this.service.issueLease({
      project: q.project,
      pool: q.pool || "default",
      sticky: q.sticky === "true",
      country: q.country,
    });
  }

  @Get(":id/test")
  async testProxy(@Param("id") id: string) {
    return await this.service.testProxy(id);
  }

  @Post(":leaseId/release")
  async release(@Param("leaseId") leaseId: string, @Body() body: any) {
    await this.service.releaseLease(leaseId, body);
    return { ok: true };
  }

  @Post(":leaseId/mark-failed")
  async fail(@Param("leaseId") leaseId: string, @Body() body: any) {
    await this.service.markFailed(leaseId, body?.reason || "unknown");
    return { ok: true };
  }

  @Post()
  @ApiOperation({ summary: "Create a new proxy" })
  @ApiBody({ type: CreateProxyDto })
  @ApiResponse({
    status: 201,
    description: "Created proxy",
    type: CreateProxyDto,
  })
  async create(@Body() data: CreateProxyDto) {
    return await this.service.createProxy(data);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update proxy details" })
  @ApiParam({ name: "id", description: "Proxy ID" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        meta: { type: "object" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Updated proxy",
    type: CreateProxyDto,
  })
  async update(@Param("id") id: string, @Body() data: any) {
    return await this.service.updateProxy(id, data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a proxy" })
  @ApiParam({ name: "id", description: "Proxy ID" })
  @ApiResponse({
    status: 200,
    description: "Deletion success",
    schema: { properties: { success: { type: "boolean" } } },
  })
  async delete(@Param("id") id: string) {
    return await this.service.deleteProxy(id);
  }
}
