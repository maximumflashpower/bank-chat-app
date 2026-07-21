import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';

@ApiTags('Cards — Transactions')
@ApiBearerAuth()
@Controller('v1/cards/transactions')
export class TransactionController {
  constructor(private readonly txnService: TransactionService) {}

  @Get('card/:cardId')
  @ApiOperation({ summary: 'Transacciones por tarjeta' })
  async findByCard(@Param('cardId') cardId: string, @Query('limit') limit?: string) {
    return this.txnService.findByCard(cardId, limit ? parseInt(limit) : 50);
  }

  @Get(':txnId')
  @ApiOperation({ summary: 'Detalle transacción' })
  async findById(@Param('txnId') txnId: string) {
    return this.txnService.findById(txnId);
  }

  @Post(':txnId/settle')
  @ApiOperation({ summary: 'Settle transacción' })
  async settle(@Param('txnId') txnId: string) {
    return this.txnService.settleTransaction(txnId);
  }

  @Post(':txnId/reverse')
  @ApiOperation({ summary: 'Reversar transacción' })
  async reverse(@Param('txnId') txnId: string) {
    return this.txnService.reverseTransaction(txnId);
  }

  @Post('authorize')
  @ApiOperation({ summary: 'Motor de autorización' })
  async authorize(@Body() data: any) {
    return this.txnService.authorize(data as any);
  }

  @Get('card/:cardId/summary')
  @ApiOperation({ summary: 'Resumen de gasto' })
  async getSummary(@Param('cardId') cardId: string, @Query('days') days?: string) {
    return this.txnService.getSpendingSummary(cardId, days ? parseInt(days) : 30);
  }
}
