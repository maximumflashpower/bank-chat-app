import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from '../services/payment.service.js';
import { ChannelType } from '../entities/payment-transaction-hub.entity.js';

@Controller('v1/payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() body: {
    channelType: ChannelType;
    paymentMethodUsed: string;
    payeePayerIdentifier: string;
    amount: number;
    currencyIsoCode: string;
    transactionFee?: number;
  }, @Request() req: any) {
    return this.paymentService.initiatePayment({
      initiatorId: req.user.id,
      ...body,
    });
  }

  @Post('split-bill')
  async splitBill(@Body() body: {
    paymentMethodUsed: string;
    totalAmount: number;
    currencyIsoCode: string;
    participants: { userId: string; percentage: number }[];
  }, @Request() req: any) {
    return this.paymentService.splitBill({
      initiatorId: req.user.id,
      ...body,
    });
  }

  @Post('split-bill/:id/remind')
  async sendSplitReminders(@Param('id') id: string) {
    return this.paymentService.sendSplitReminders(id);
  }

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('channelType') channelType?: ChannelType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: { channelType?: ChannelType; startDate?: Date; endDate?: Date } = {};
    if (channelType) filters.channelType = channelType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    return this.paymentService.getHistory(req.user.id, filters);
  }

  @Post('refund/process')
  async processRefund(@Body() body: {
    originalTxnId: string;
    refundAmount: number;
    reason: string;
  }) {
    return this.paymentService.processRefund(body.originalTxnId, body.refundAmount, body.reason);
  }

  @Post('chargeback/contest')
  async contestChargeback(@Body() body: {
    originalTxnId: string;
    disputeCaseId: string;
    evidenceDescription: string;
  }) {
    return this.paymentService.contestChargeback(body);
  }

  @Post('retry/:txnId')
  async retryPayment(@Param('txnId') txnId: string) {
    return this.paymentService.retryFailedPayment(txnId);
  }

  @Post('recurring')
  async processRecurring(@Body() body: {
    paymentMethodUsed: string;
    payeePayerIdentifier: string;
    amount: number;
    currencyIsoCode: string;
  }, @Request() req: any) {
    return this.paymentService.processRecurringPayment({
      initiatorId: req.user.id,
      ...body,
    });
  }

  @Post('tax/calculate')
  async calculateTax(@Body() body: {
    amount: number;
    taxRatePct: number;
    taxType: string;
  }) {
    return this.paymentService.calculateTax(body.amount, body.taxRatePct, body.taxType);
  }

  @Get('crypto/exchange-rate')
  async getCryptoExchangeRate(@Query('from') from: string, @Query('to') to: string, @Request() req: any) {
    // Delegate to crypto service via module injection
    return { message: 'Use /api/v1/payments/crypto/exchange-rate endpoint', from, to };
  }
}
