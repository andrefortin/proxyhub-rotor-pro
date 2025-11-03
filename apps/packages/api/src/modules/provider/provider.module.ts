import { Module } from "@nestjs/common";
import { ProviderService } from "./provider.service";
import { ProviderController } from "./provider.controller";
import { PrismaModule } from "../../common/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}