import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DpiaService } from '../services/dpia.service';
import { CreateDpiaDto } from '../dto/create-dpia.dto';
import { ReviewDpiaDto } from '../dto/review-dpia.dto';

@ApiTags('Privacy — DPIA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class DpiaController {
  constructor(private readonly service: DpiaService) {}

  @Post('dpia/create')
  @ApiOperation({ summary: 'Crear DPIA assessment (PRIV-DPIA-001) — Admin' })
  async create(@Body() dto: CreateDpiaDto) {
    return this.service.createDpia(dto);
  }

  @Get('dpia/:id')
  @ApiOperation({ summary: 'Ver DPIA completo (PRIV-DPIA-001) — Admin' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('dpia')
  @ApiOperation({ summary: 'Listar DPIAs (PRIV-DPIA-001) — Admin' })
  async listAll() {
    return this.service.listDpias();
  }

  @Put('dpia/:id/review')
  @ApiOperation({ summary: 'Revisar/aprobar DPIA (PRIV-DPIA-003) — Admin' })
  async review(@Param('id') id: string, @Body() dto: ReviewDpiaDto) {
    return this.service.reviewDpia(id, dto);
  }

  @Put('dpia/:id/evaluate')
  @ApiOperation({ summary: 'Evaluar riesgo y mitigación (PRIV-DPIA-002) — Admin' })
  async evaluate(
    @Param('id') id: string,
    @Body() body: { riskLevel: string; riskDescription: string; mitigationMeasures: string; residualRisk?: string },
  ) {
    return this.service.evaluateRisk(
      id,
      body.riskLevel as any,
      body.riskDescription,
      body.mitigationMeasures,
      body.residualRisk as any,
    );
  }

  @Post('dpia/:id/consult-dpo')
  @ApiOperation({ summary: 'Consultar al DPO (PRIV-DPIA-003) — Admin' })
  async consultDpo(@Param('id') id: string, @Body() body: { dpoOpinion: string }) {
    return this.service.consultDpo(id, body.dpoOpinion);
  }

  @Post('dpia/:id/notify-authority')
  @ApiOperation({ summary: 'Notificar a autoridad supervisora (PRIV-DPIA-003) — Admin' })
  async notifyAuthority(@Param('id') id: string) {
    return this.service.notifySupervisoryAuthority(id);
  }

  @Get('dpia/high-risk/pending')
  @ApiOperation({ summary: 'Listar DPIAs de alto riesgo pendientes (PRIV-DPIA-002) — Admin' })
  async listHighRiskPending() {
    return this.service.listHighRiskPending();
  }
}
