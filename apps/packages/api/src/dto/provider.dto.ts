import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject, IsOptional, IsBoolean, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from '@prisma/client'; // Assume Prisma types available

export class ConfigDto {
  @ApiProperty({ description: 'Provider config like access_token, endpoint' })
  @IsObject()
  [key: string]: any;
}

export class CreateProviderDto {
  @ApiProperty({ description: 'Unique name for the provider' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ProviderType, description: 'Type of provider (api, file, manual)' })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiProperty({ description: 'Configuration object for the provider' })
  @IsObject()
  @ValidateNested()
  @Type(() => ConfigDto)
  config: ConfigDto;

  @ApiProperty({ description: 'Optional logo URL', required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ description: 'Whether the provider is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ProviderDto extends CreateProviderDto {
  @ApiProperty({ description: 'Unique ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsString()
  createdAt: string;
}

export class PaginatedProvidersDto {
  @ApiProperty({ type: [ProviderDto] })
  items: ProviderDto[];

  @ApiProperty({ description: 'Total number of providers' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Number of records to skip', required: false })
  skip?: number;
}