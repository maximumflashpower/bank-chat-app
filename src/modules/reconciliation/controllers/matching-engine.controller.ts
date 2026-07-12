import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchingEngineService } from '../services/matching-engine.service';
import { RunMatchingDto } from '../dto/run-matching.dto';
import { ManualMatchDto } from '../dto/manual-match.dto';
import { BulkReconcileDto } from '../dto/bulk-reconcile.dto';

@ApiTags('Reconciliation - Matching Engine')
@ApiBearerAuth()
@Controller('api/v1/recon')
export class MatchingEngineController {
  constructor(private readonly matchingEngine: MatchingEngineService) {}

  @Post('engine/run')
  @ApiOperation({ summary: 'RECON-MATCH-001: Ejecutar motor matching batch' })
  async runBatch(@Body() dto: RunMatchingDto, @Request() req: any) {
    return this.matchingEngine.runBatch(dto, req.user?.id || 'system');
  }

  @Get('engine/status/:batchId')
  @ApiOperation({ summary: 'RECON-MATCH-002: Estado de batch' })
  async getStatus(@Param('batchId') batchId: string) {
    return this.matchingEngine.getStatus(batchId);
  }

  @Get('results/matched')
  @ApiOperation({ summary: 'RECON-MATCH-003: Transacciones matcheadas' })
  async getMatched(@Query('batchId') batchId: string) {
    return this.matchingEngine.getMatchedResults(batchId);
  }

  @Get('results/unmatched')
  @ApiOperation({ summary: 'RECON-MATCH-004: Transacciones sin match' })
  async getUnmatched(@Query('batchId') batchId: string) {
    return this.matchingEngine.getUnmatchedResults(batchId);
  }

  @Post('manual-match')
  @ApiOperation({ summary: 'RECON-MATCH-005: Match manual forzado' })
  async manualMatch(@Body() dto: ManualMatchDto, @Request() req: any) {
    return this.matchingEngine.manualMatch(dto, req.user?.id || 'system');
  }

  @Post('manual-unmatch')
  @ApiOperation({ summary: 'RECON-MATCH-006: Deshacer matching' })
  async manualUnmatch(@Body('resultId') resultId: string, @Request() req: any) {
    return this.matchingEngine.manualUnmatch(resultId, req.user?.id || 'system');
  }

  @Post('bulk-reconcile')
  @ApiOperation({ summary: 'RECON-MATCH-007: Conciliación masiva' })
  async bulkReconcile(@Body() dto: BulkReconcileDto, @Request() req: any) {
    return this.matchingEngine.bulkReconcile(dto, req.user?.id || 'system');
  }
}
