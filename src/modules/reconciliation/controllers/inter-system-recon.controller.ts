import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterSystemReconService } from '../services/inter-system-recon.service';
import { RunInterSystemDto } from '../dto/run-inter-system.dto';

@ApiTags('Reconciliation - Inter-System')
@ApiBearerAuth()
@Controller('v1/recon')
export class InterSystemReconController {
  constructor(private readonly interSystem: InterSystemReconService) {}

  @Post('inter-system/run')
  @ApiOperation({ summary: 'RECON-IS-001: Ejecutar reconciliación inter-sistema' })
  async run(@Body() dto: RunInterSystemDto, @Request() req: any) {
    return this.interSystem.run(dto, req.user?.id || 'system');
  }

  @Get('inter-system/breaks/:batchId')
  @ApiOperation({ summary: 'RECON-IS-002: Obtener breaks' })
  async getBreaks(@Param('batchId') batchId: string) {
    return this.interSystem.getBreaks(batchId);
  }

  @Post('inter-system/breaks/resolve')
  @ApiOperation({ summary: 'RECON-IS-003: Resolver break' })
  async resolveBreak(
    @Body('breakId') breakId: string,
    @Body('resolutionAction') resolutionAction: string,
    @Request() req: any,
    @Body('adjustmentEntryId') adjustmentEntryId?: string,
  ) {
    return this.interSystem.resolveBreak(breakId, resolutionAction, req.user?.id || 'system', adjustmentEntryId);
  }

  @Post('inter-system/breaks/escalate')
  @ApiOperation({ summary: 'RECON-IS-004: Escalar break' })
  async escalateBreak(@Body('breakId') breakId: string, @Body('reason') reason: string) {
    return this.interSystem.escalateBreak(breakId, reason);
  }

  @Post('inter-system/breaks/assign')
  @ApiOperation({ summary: 'RECON-IS-005: Asignar break' })
  async assignBreak(@Body('breakId') breakId: string, @Body('assignedUserId') assignedUserId: string) {
    return this.interSystem.assignBreak(breakId, assignedUserId);
  }

  @Post('inter-system/breaks/auto-resolve')
  @ApiOperation({ summary: 'RECON-IS-006: Auto-resolver stubs' })
  async autoResolveStubs(@Body('batchId') batchId: string) {
    return { autoResolved: await this.interSystem.autoResolveStubs(batchId) };
  }

  @Get('inter-system/breaks/metrics/:batchId')
  @ApiOperation({ summary: 'RECON-IS-007: Métricas de breaks' })
  async getBreakMetrics(@Param('batchId') batchId: string) {
    return this.interSystem.getBreakMetrics(batchId);
  }

  @Get('inter-system/breaks/trend')
  @ApiOperation({ summary: 'RECON-IS-008: Tendencias de breaks' })
  async getBreakTrend(@Query('periodStart') periodStart: string, @Query('periodEnd') periodEnd: string) {
    return this.interSystem.getBreakTrend(periodStart, periodEnd);
  }

  @Get('inter-system/breaks/export/:batchId')
  @ApiOperation({ summary: 'RECON-IS-009: Exportar breaks' })
  async exportBreaks(@Param('batchId') batchId: string, @Query('format') format: 'csv' | 'json' = 'json') {
    return { data: await this.interSystem.exportBreaks(batchId, format) };
  }
}
