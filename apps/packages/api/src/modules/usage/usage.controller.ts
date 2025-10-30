import { Controller, Get } from '@nestjs/common';
import { UsageService } from './usage.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('usage')
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get API usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage stats object with daily responses and codes' })
  getStats() {
    return this.usageService.getStats();
  }
}