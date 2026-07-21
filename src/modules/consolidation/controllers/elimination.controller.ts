import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EliminationEngineService } from '../services/elimination-engine.service';
import { CreateEliminationDto } from '../dto/create-elimination.dto';
import { ManualMatchDto } from '../dto/manual-match.dto';

@ApiTags('Consolidation — Eliminations')
@ApiBearerAuth()
@Controller('consolidation/eliminations')
export class EliminationController {
  constructor(private readonly elimService: EliminationEngineService) {}

  @Get('run/:runId')
  @ApiOperation({ summary: 'Listar eliminaciones por run' })
  async findByRun(@Param('runId') runId: string) {
    return this.elimService.findByRun(runId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear entrada de eliminación' })
  async create(@Body() dto: CreateEliminationDto) {
    return this.elimService.createEntry(dto);
  }

  @Post('run/:runId/auto-match')
  @ApiOperation({ summary: 'Ejecutar auto-matching' })
  async autoMatch(@Param('runId') runId: string) {
    return this.elimService.autoMatch(runId);
  }

  @Put(':id/manual-match')
  @ApiOperation({ summary: 'Match manual entre entradas' })
  async manualMatch(@Param('id') id: string, @Body() dto: ManualMatchDto) {
    return this.elimService.manualMatch(id, dto.matchedEntryId, dto.eliminatedAmount);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Ejecutar eliminación individual' })
  async execute(@Param('id') id: string) {
    return this.elimService.executeElimination(id);
  }

  @Post('run/:runId/execute-batch')
  @ApiOperation({ summary: 'Ejecutar eliminaciones batch' })
  async executeBatch(@Param('runId') runId: string) {
    return this.elimService.executeBatchElimination(runId);
  }

  @Get('run/:runId/summary')
  @ApiOperation({ summary: 'Resumen de eliminaciones del run' })
  async getSummary(@Param('runId') runId: string) {
    return this.elimService.getEliminationSummary(runId);
  }
}
