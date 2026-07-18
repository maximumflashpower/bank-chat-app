import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertService } from '../services/alert.service';

@ApiTags('Retail — Alerts')
@ApiBearerAuth()
@Controller('v1/retail/alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post('configure')
  @ApiOperation({ summary: 'Configurar alerta de saldo/transacción' })
  async configure(@Body() data: any) {
    return this.alertService.createAlert(data as any);
  }

  @Get(':alertId')
  @ApiOperation({ summary: 'Detalle alerta' })
  async findById(@Param('alertId') alertId: string) {
    return this.alertService.findById(alertId);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Listar alertas por cuenta' })
  async findByAccount(@Param('accountId') accountId: string) {
    return this.alertService.findByAccount(accountId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar alertas por usuario' })
  async findByUser(@Param('userId') userId: string) {
    return this.alertService.findByUser(userId);
  }

  @Put(':alertId/toggle')
  @ApiOperation({ summary: 'Activar/desactivar alerta' })
  async toggle(@Param('alertId') alertId: string) {
    return this.alertService.toggleAlert(alertId);
  }

  @Delete(':alertId')
  @ApiOperation({ summary: 'Eliminar alerta' })
  async delete(@Param('alertId') alertId: string) {
    await this.alertService.deleteAlert(alertId);
    return { success: true };
  }

  @Post('check-low-balance/:accountId')
  @ApiOperation({ summary: 'Verificar alerta saldo bajo' })
  async checkLowBalance(@Param('accountId') accountId: string, @Body() body: { threshold: number }) {
    return this.alertService.checkLowBalance(accountId, body.threshold);
  }

  @Post('check-large-txn/:accountId')
  @ApiOperation({ summary: 'Verificar alerta transacción grande' })
  async checkLargeTransaction(@Param('accountId') accountId: string, @Body() body: { amount: number }) {
    return this.alertService.checkLargeTransaction(accountId, body.amount);
  }
}
