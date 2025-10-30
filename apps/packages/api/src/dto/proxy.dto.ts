import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ProxyQueryDto {
  @ApiProperty({ description: 'Filter by pool name', required: false })
  @IsOptional()
  @IsString()
  pool?: string;

  @ApiProperty({ description: 'Filter by provider ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: 'Bounding box filter [minLon,minLat,maxLon,maxLat]', required: false })
  @IsOptional()
  @IsString()
  bbox?: string;

  @ApiProperty({ description: 'Page number (default 1)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: 'Records per page (default 10, max 100)', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ description: 'Number of records to skip (overrides page)', required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @ApiProperty({ description: 'Sample random proxies (true/false)', required: false })
  @IsOptional()
  @IsString()
  sample?: string;
}

export class CreateProxyDto {
  @ApiProperty({ description: 'Pool the proxy belongs to' })
  @IsString()
  pool: string;

  @ApiProperty({ description: 'Host IP' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'Port number' })
  @IsNumber()
  @Type(() => Number)
  port: number;

  @ApiProperty({ description: 'Username if auth required', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Password if auth required', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: ['http', 'https', 'socks4', 'socks5'], description: 'Protocol', default: 'http' })
  @IsOptional()
  @IsEnum(['http', 'https', 'socks4', 'socks5'])
  protocol?: string;

  @ApiProperty({ type: [String], description: 'Tags', required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Provider ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: 'Additional meta', required: false })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  // Geo fields optional
  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}

export class PaginatedProxiesDto {
  @ApiProperty({ type: [CreateProxyDto] })
  items: CreateProxyDto[];

  @ApiProperty({ description: 'Total number of proxies matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Skip value used', required: false })
  skip?: number;
}