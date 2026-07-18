import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransferService } from '../services/transfer.service';
import { TransferFrequency, TransferType } from '../entities/retail-transfer-instruction.entity';

@ApiTags('Retail — Transfers')
@ApiBearerAuth()
@Controller('v1/retail/transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('internal')
  @ApiOperation({ summary: 'Transferencia interna entre propias cuentas' })
  async createInternal(@Body() data: any) {
    data.transferType = TransferType.INTERNAL;
    return this.transferService.createTransfer(data as any);
  }

  @Post('external')
  @ApiOperation({ summary: 'Transferencia externa ACH/WIRE/P2P' })
  async createExternal(@Body() data: any) {
    return this.transferService.createTransfer(data as any);
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Configurar transferencia recurrente' })
  async createRecurring(@Body() data: any) {
    data.frequency = TransferFrequency.RECURRING;
    return this.transferService.createTransfer(data as any);
  }

  @Get('list/:userId')
  @ApiOperation({ summary: 'Listar transferencias por usuario' })
  async findByUser(@Param('userId') userId: string) {
    return this.transferService.findByInitiator(userId);
  }

  @Get('recurring/list')
  @ApiOperation({ summary: 'Listar transferencias recurrentes' })
  async listRecurring(@Query('userId') userId: string) {
    return this.transferService.listRecurring(userId);
  }

  @Get('transfer/:transferId')
  @ApiOperation({ summary: 'Detalle transferencia' })
  async findById(@Param('transferId') transferId: string) {
    return this.transferService.findById(transferId);
  }

  @Post('transfer/:transferId/execute')
  @ApiOperation({ summary: 'Ejecutar transferencia pendiente' })
  async execute(@Param('transferId') transferId: string) {
    return this.transferService.executeTransfer(transferId);
  }

  @Put('transfer/:transferId/cancel')
  @ApiOperation({ summary: 'Cancelar transferencia' })
  async cancel(@Param('transferId') transferId: string) {
    return this.transferService.cancelTransfer(transferId);
  }

  @Delete('recurring/:recurringId')
  @ApiOperation({ summary: 'Cancelar transferencia recurrente' })
  async cancelRecurring(@Param('recurringId') recurringId: string) {
    return this.transferService.cancelRecurring(recurringId);
  }

  @Post('recurring/process-batch')
  @ApiOperation({ summary: 'Procesar recurrentes vencidas (cron)' })
  async processBatch() {
    return this.transferService.processDueRecurring();
  }
}
