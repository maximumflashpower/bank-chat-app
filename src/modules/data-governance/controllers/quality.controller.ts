import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { QualityService } from '../services/quality.service';

@Controller('api/v1/datagov/quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get('score')
  async getScore(@Query('catalogEntryId') catalogEntryId: string) {
    return this.qualityService.getDashboard(catalogEntryId);
  }

  @Post('validate')
  async validate(
    @Body('catalogEntryId') catalogEntryId: string,
    @Body('rules') rules: Array<{ field: string; rule: string; expected: unknown }>,
  ) {
    return this.qualityService.validate(catalogEntryId, rules);
  }

  @Get('anomalies')
  async getAnomalies() {
    return this.qualityService.detectAnomalies();
  }

  @Post('remediate')
  async createRemediation(
    @Body('catalogEntryId') catalogEntryId: string,
    @Body('assignedTo') assignedTo: string,
    @Body('description') description: string,
  ) {
    return this.qualityService.createRemediation(catalogEntryId, assignedTo, description);
  }
}
