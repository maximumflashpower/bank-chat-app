import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SweepService } from '../services/sweep.service';
import { SweepType, SweepFrequency } from '../entities/business-sweep-rule.entity';

@ApiTags('Business — Sweeps')
@ApiBearerAuth()
@Controller('v1/business/sweep')
export class SweepController {
  constructor(private readonly sweepService: SweepService) {}

  @Post('rule/create')
  @ApiOperation({ summary: 'Crear regla de sweep' })
  async createRule(@Body() data: any) {
    return this.sweepService.createRule(data as any);
  }

  @Get('rules/:accountId')
  @ApiOperation({ summary: 'Listar reglas por cuenta origen' })
  async findByAccount(@Param('accountId') accountId: string) {
    return this.sweepService.findBySourceAccount(accountId);
  }

  @Get('rule/:ruleId')
  @ApiOperation({ summary: 'Detalle regla' })
  async findById(@Param('ruleId') ruleId: string) {
    return this.sweepService.findById(ruleId);
  }

  @Post('rule/:ruleId/execute')
  @ApiOperation({ summary: 'Ejecutar sweep manual' })
  async executeSweep(@Param('ruleId') ruleId: string) {
    return this.sweepService.executeSweep(ruleId);
  }

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Procesar sweeps programados (cron)' })
  async processScheduledSweeps() {
    const count = await this.sweepService.processScheduledSweeps();
    return { executed: count };
  }

  @Post('rule/:ruleId/deactivate')
  @ApiOperation({ summary: 'Desactivar regla' })
  async deactivateRule(@Param('ruleId') ruleId: string) {
    return this.sweepService.deactivateRule(ruleId);
  }

  @Post('rule/:ruleId/activate')
  @ApiOperation({ summary: 'Activar regla' })
  async activateRule(@Param('ruleId') ruleId: string) {
    return this.sweepService.activateRule(ruleId);
  }

  @Get('rule/:ruleId/history')
  @ApiOperation({ summary: 'Historial ejecuciones' })
  async getHistory(@Param('ruleId') ruleId: string, @Query('days') days?: string) {
    return this.sweepService.getExecutionHistory(ruleId, parseInt(days || '30'));
  }
}
