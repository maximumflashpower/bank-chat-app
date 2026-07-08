import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DecisionService } from '../services/decision.service';
import { DecisionQueryDto } from '../dto/decision-query.dto';

@ApiTags('Governance — Decisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/decisions')
export class DecisionController {
  constructor(private readonly decisionService: DecisionService) {}

  @Get()
  @ApiOperation({ summary: 'Search decision logs' })
  @ApiResponse({ status: 200, description: 'List of decisions' })
  async search(@Query() query: DecisionQueryDto) {
    return this.decisionService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get decision details' })
  @ApiResponse({ status: 200, description: 'Decision details' })
  async findById(@Param('id') id: string) {
    return this.decisionService.findById(id);
  }

  @Get(':id/rationale')
  @ApiOperation({ summary: 'Export decision rationale' })
  @ApiResponse({ status: 200, description: 'Decision rationale' })
  async exportRationale(@Param('id') id: string) {
    return this.decisionService.exportRationale(id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Decision analytics' })
  @ApiResponse({ status: 200, description: 'Aggregated analytics' })
  async getAnalytics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.decisionService.getAnalytics(fromDate, toDate);
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Decision audit trail / replay' })
  @ApiResponse({ status: 200, description: 'Audit trail' })
  async getAuditTrail(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.decisionService.getAuditTrail(entityType, entityId);
  }
}
