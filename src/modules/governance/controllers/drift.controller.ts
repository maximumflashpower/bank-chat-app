import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DriftService } from '../services/drift.service';

@ApiTags('Governance — Drift')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/drift')
export class DriftController {
  constructor(private readonly driftService: DriftService) {}

  @Get('report')
  @ApiOperation({ summary: 'Get drift report' })
  @ApiResponse({ status: 200, description: 'Drift report' })
  async getReport() {
    return this.driftService.getReport();
  }

  @Post(':id/remediate')
  @ApiOperation({ summary: 'Execute drift remediation' })
  @ApiResponse({ status: 200, description: 'Remediation started' })
  async remediate(@Param('id') id: string, @Body() body: { remediationAction?: string }) {
    return this.driftService.remediate(id, body.remediationAction || 'Manual remediation');
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark drift as resolved' })
  @ApiResponse({ status: 200, description: 'Drift resolved' })
  async markResolved(@Param('id') id: string) {
    return this.driftService.markResolved(id);
  }
}
