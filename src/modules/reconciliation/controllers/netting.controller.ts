import { Controller, Get, Post, Param, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NettingService } from '../services/netting.service';
import { CalculateNettingDto } from '../dto/calculate-netting.dto';

@ApiTags('Reconciliation - Netting')
@ApiBearerAuth()
@Controller('api/v1/recon')
export class NettingController {
  constructor(private readonly netting: NettingService) {}

  @Post('netting/calculate')
  @ApiOperation({ summary: 'RECON-NET-001: Calcular posiciones netas' })
  async calculate(@Body() dto: CalculateNettingDto, @Request() req: any) {
    return this.netting.calculate(dto, req.user?.id || 'system');
  }

  @Post('netting/execute')
  @ApiOperation({ summary: 'RECON-NET-002: Ejecutar netting' })
  async execute(@Body('batchId') batchId: string, @Request() req: any) {
    return this.netting.execute(batchId, req.user?.id || 'system');
  }

  @Get('netting/result/:batchId')
  @ApiOperation({ summary: 'RECON-NET-003: Resultado netting batch' })
  async getResult(@Param('batchId') batchId: string) {
    return this.netting.getResult(batchId);
  }

  @Post('netting/post/:batchId')
  @ApiOperation({ summary: 'RECON-NET-004: Postear al ledger' })
  async postToLedger(@Param('batchId') batchId: string) {
    return this.netting.postToLedger(batchId);
  }

  @Post('netting/cancel/:batchId')
  @ApiOperation({ summary: 'RECON-NET-005: Cancelar netting' })
  async cancel(@Param('batchId') batchId: string) {
    return this.netting.cancel(batchId);
  }
}
