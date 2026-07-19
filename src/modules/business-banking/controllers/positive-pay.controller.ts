import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PositivePayService } from '../services/positive-pay.service';
import { PositivePayDecision } from '../entities/business-positive-pay-record.entity';

@ApiTags('Business — Positive Pay')
@ApiBearerAuth()
@Controller('v1/business/positive-pay')
export class PositivePayController {
  constructor(private readonly positivePayService: PositivePayService) {}

  @Post('check/create')
  @ApiOperation({ summary: 'Registrar cheque en positive pay' })
  async createCheck(@Body() body: { accountId: string; checkNumber: string; amount: number; payeeName: string; issueDate: string }) {
    return this.positivePayService.createCheck(body.accountId, body.checkNumber, body.amount, body.payeeName, new Date(body.issueDate));
  }

  @Get('checks/:accountId')
  @ApiOperation({ summary: 'Listar cheques por cuenta' })
  async findByAccount(@Param('accountId') accountId: string) {
    return this.positivePayService.findByAccount(accountId);
  }

  @Get('check/:id')
  @ApiOperation({ summary: 'Detalle cheque' })
  async findById(@Param('id') id: string) {
    return this.positivePayService.findById(id);
  }

  @Post('check/process-presentment')
  @ApiOperation({ summary: 'Procesar presentment de cheque' })
  async processPresentment(@Body() body: { checkNumber: string; presentedAmount: number; presentedPayee: string }) {
    return this.positivePayService.processPresentment(body.checkNumber, body.presentedAmount, body.presentedPayee);
  }

  @Put('check/:id/decide')
  @ApiOperation({ summary: 'Decidir pagar/retornar cheque' })
  async markDecided(@Param('id') id: string, @Body() body: { decision: PositivePayDecision; decidedBy: string }) {
    return this.positivePayService.markDecided(id, body.decision, body.decidedBy);
  }

  @Post('check/:id/void')
  @ApiOperation({ summary: 'Anular cheque' })
  async voidCheck(@Param('id') id: string) {
    return this.positivePayService.voidCheck(id);
  }

  @Get('statistics/:accountId')
  @ApiOperation({ summary: 'Estadísticas positive pay' })
  async getStatistics(@Param('accountId') accountId: string) {
    return this.positivePayService.getStatistics(accountId);
  }
}
