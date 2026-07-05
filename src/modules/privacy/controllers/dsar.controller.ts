import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DsarService } from '../services/dsar.service';
import { CreateDsarRequestDto } from '../dto/create-dsar-request.dto';
import { DsarReviewDto } from '../dto/dsar-review.dto';

@ApiTags('Privacy — DSAR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/privacy')
export class DsarController {
  constructor(private readonly dsarService: DsarService) {}

  @Post('dsar/request')
  @ApiOperation({ summary: 'Crear solicitud DSAR (PRIV-DSAR-001)' })
  async createRequest(@Req() req: Request, @Body() dto: CreateDsarRequestDto) {
    const userId = (req.user as any)?.id;
    return this.dsarService.createRequest(userId, dto);
  }

  @Get('dsar/status/:id')
  @ApiOperation({ summary: 'Estado de solicitud DSAR (PRIV-DSAR-004)' })
  async getStatus(@Req() req: Request, @Param('id') requestId: string) {
    const userId = (req.user as any)?.id;
    return this.dsarService.getStatus(requestId, userId);
  }

  @Get('dsar/download/:id')
  @ApiOperation({ summary: 'Descargar paquete de datos (PRIV-DSAR-003)' })
  async downloadPackage(@Req() req: Request, @Param('id') requestId: string) {
    const userId = (req.user as any)?.id;
    return this.dsarService.downloadDataPackage(requestId, userId);
  }

  @Post('erasure/request')
  @ApiOperation({ summary: 'Solicitar derecho al olvido (PRIV-DSAR-005)' })
  async requestErasure(@Req() req: Request, @Body() dto: CreateDsarRequestDto) {
    const userId = (req.user as any)?.id;
    // Forzar tipo erasure
    dto.requestType = 'erasure' as any;
    return this.dsarService.createRequest(userId, dto);
  }

  @Get('erasure/status/:id')
  @ApiOperation({ summary: 'Estado de eliminación (PRIV-DSAR-005)' })
  async getErasureStatus(@Req() req: Request, @Param('id') requestId: string) {
    const userId = (req.user as any)?.id;
    return this.dsarService.getStatus(requestId, userId);
  }

  // --- Endpoints admin/DPO ---

  @Post('dsar/:id/process')
  @ApiOperation({ summary: 'Iniciar compilación de paquete (PRIV-DSAR-002) — Admin' })
  async processRequest(@Param('id') requestId: string) {
    return this.dsarService.compileDataPackage(requestId);
  }

  @Put('dsar/:id/review')
  @ApiOperation({ summary: 'Actualizar estado DSAR (DPO review) — Admin' })
  async reviewRequest(@Param('id') requestId: string, @Body() dto: DsarReviewDto) {
    return this.dsarService.updateStatus(requestId, dto);
  }

  @Post('erasure/:id/execute')
  @ApiOperation({ summary: 'Ejecutar erasure (PRIV-DSAR-006) — Admin' })
  async executeErasure(@Param('id') requestId: string) {
    return this.dsarService.executeErasure(requestId);
  }

  @Get('dsar/overdue')
  @ApiOperation({ summary: 'Listar solicitudes vencidas (PRIV-DSAR-004) — Admin' })
  async checkOverdue() {
    return this.dsarService.checkOverdueRequests();
  }
}
