import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SignatoryService } from '../services/signatory.service';
import { AuthorizationLevel } from '../entities/business-signatory.entity';

@ApiTags('Business — Signatories')
@ApiBearerAuth()
@Controller('v1/business/signatory')
export class SignatoryController {
  constructor(private readonly signatoryService: SignatoryService) {}

  @Post('add')
  @ApiOperation({ summary: 'Agregar firmante autorizado' })
  async addSignatory(@Body() data: any) {
    return this.signatoryService.addSignatory(data as any);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Listar firmantes por cuenta' })
  async findByAccount(@Param('accountId') accountId: string) {
    return this.signatoryService.findByAccount(accountId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar cuentas del usuario' })
  async findByUser(@Param('userId') userId: string) {
    return this.signatoryService.findByUser(userId);
  }

  @Get(':signatoryId')
  @ApiOperation({ summary: 'Detalle firmante' })
  async findById(@Param('signatoryId') signatoryId: string) {
    return this.signatoryService.findById(signatoryId);
  }

  @Put(':signatoryId/authorization')
  @ApiOperation({ summary: 'Actualizar nivel autorización' })
  async updateAuthorization(@Param('signatoryId') signatoryId: string, @Body() body: { authorizationLevel: AuthorizationLevel }) {
    return this.signatoryService.updateAuthorization(signatoryId, body.authorizationLevel);
  }

  @Put(':signatoryId/limits')
  @ApiOperation({ summary: 'Configurar límites individuales' })
  async setLimits(@Param('signatoryId') signatoryId: string, @Body() body: { individualLimit: number; cosignAbove: number }) {
    return this.signatoryService.setLimits(signatoryId, body.individualLimit, body.cosignAbove);
  }

  @Post(':signatoryId/remove')
  @ApiOperation({ summary: 'Remover firmante' })
  async removeSignatory(@Param('signatoryId') signatoryId: string) {
    const result = await this.signatoryService.removeSignatory(signatoryId, 'system');
    return { success: true, data: result };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar autorización para acción' })
  async validateAuthorization(@Body() body: { accountId: string; userId: string; action: string }) {
    return this.signatoryService.validateAuthorization(body.accountId, body.userId, body.action);
  }

  @Post('check-dual-sig')
  @ApiOperation({ summary: 'Verificar si requiere doble firma' })
  async requiresDualSignature(@Body() body: { accountId: string; amount: number }) {
    return this.signatoryService.requiresDualSignature(body.amount, body.accountId);
  }
}
