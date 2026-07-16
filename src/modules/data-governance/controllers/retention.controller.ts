import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RetentionService } from '../services/retention.service';
import { CreateRetentionPolicyDto } from '../dto/retention.dto';

@Controller('api/v1/datagov/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get('policies')
  async listPolicies() {
    return this.retentionService.findAllPolicies();
  }

  @Post('create')
  async createPolicy(@Body() dto: CreateRetentionPolicyDto) {
    return this.retentionService.createPolicy(dto);
  }

  @Get('schedule')
  async getSchedule(@Query('daysAhead') daysAhead?: string) {
    return this.retentionService.getUpcomingDeletions(daysAhead ? parseInt(daysAhead) : 30);
  }

  @Post('execute/:policyId')
  async executeDeletion(@Param('policyId') policyId: string) {
    return this.retentionService.executeSoftDelete(policyId);
  }

  @Post(':policyId/legal-hold')
  async setLegalHold(@Param('policyId') policyId: string, @Body('hold') hold: boolean) {
    return this.retentionService.setLegalHold(policyId, hold);
  }
}
