import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentMethodService } from '../services/payment-method.service.js';
import { PaymentType } from '../entities/payment-method-source.entity.js';

@Controller('v1/payment-methods')
@UseGuards(AuthGuard('jwt'))
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post('add')
  async addPaymentMethod(@Body() body: {
    paymentType: PaymentType;
    paymentSubtype?: string;
    sourceBankAccountId?: string;
    sourceCardId?: string;
    sourceExternalWalletRef?: string;
    labelNameDisplay?: string;
    currencySupported?: string;
    dailySpendLimit?: number;
    weeklySpendLimit?: number;
    monthlySpendLimit?: number;
  }, @Request() req: any) {
    return this.paymentMethodService.addMethod({
      customerId: req.user.id,
      ...body,
    });
  }

  @Put(':id/primary')
  async setPrimary(@Param('id') id: string) {
    return this.paymentMethodService.setPrimary(id);
  }

  @Delete(':id')
  async removeMethod(@Param('id') id: string) {
    await this.paymentMethodService.removeMethod(id);
    return { removed: true };
  }

  @Get()
  async getMethods(@Request() req: any) {
    return this.paymentMethodService.getMethodsByCustomer(req.user.id);
  }

  @Post(':id/verify-microdeposit')
  async verifyMicrodeposit(@Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.paymentMethodService.verifyWithMicrodeposit(id, body.verified);
  }

  @Post(':id/spend-limits')
  async updateSpendLimits(@Param('id') id: string, @Body() body: {
    dailySpendLimit?: number;
    weeklySpendLimit?: number;
    monthlySpendLimit?: number;
  }) {
    return this.paymentMethodService.updateSpendLimits(id, body);
  }

  @Post(':id/mark-used')
  async markAsUsed(@Param('id') id: string) {
    return this.paymentMethodService.markAsUsed(id);
  }
}
