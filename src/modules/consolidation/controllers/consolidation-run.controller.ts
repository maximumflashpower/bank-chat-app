import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsolidationRunService } from '../services/consolidation-run.service';
import { CreateRunDto } from '../dto/create-run.dto';

@ApiTags('Consolidation — Runs')
@ApiBearerAuth()
@Controller('consolidation/runs')
export class ConsolidationRunController {
  constructor(private readonly runService: ConsolidationRunService) {}

  @Get()
  @ApiOperation({ summary: 'Listar runs de consolidación' })
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.runService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener run por ID' })
  async findById(@Param('id') id: string) {
    return this.runService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo run de consolidación' })
  async create(@Body() dto: CreateRunDto) {
    return this.runService.createRun(dto as any);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar run de consolidación' })
  async start(@Param('id') id: string) {
    return this.runService.startRun(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Aprobar run de consolidación' })
  async approve(@Param('id') id: string, @Body() body: { approverId: string }) {
    return this.runService.approveRun(id, body.approverId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Obtener estadísticas del run' })
  async getStatistics(@Param('id') id: string) {
    return this.runService.getRunStatistics(id);
  }
}
