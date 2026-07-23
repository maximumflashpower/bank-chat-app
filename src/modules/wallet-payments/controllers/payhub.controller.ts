import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PayhubService } from '../services/payhub.service.js';

@Controller('v1/payhub')
@UseGuards(AuthGuard('jwt'))
export class PayhubController {
  constructor(private readonly payhubService: PayhubService) {}

  @Get('consolidated-view')
  async getConsolidatedView(@Query('organizationId') organizationId: string) {
    return this.payhubService.getConsolidatedView(organizationId);
  }

  @Post('rule/create')
  async createRule(@Body() body: {
    organizationId: string;
    ruleNameDescription: string;
    triggerConditionExpression: Record<string, unknown>;
    approvalHierarchyChain?: string[];
    requiredApprovalLevels?: number;
    maxAmountWithoutOverride?: number;
    autoApproveBelowAmount?: number;
    notificationChannelsAlert?: string[];
    applicableChannelTypes?: string[];
  }) {
    return this.payhubService.createRule(body);
  }

  @Get('rules')
  async listRules(@Query('organizationId') organizationId: string) {
    return this.payhubService.listRules(organizationId);
  }

  @Put('rule/:id')
  async updateRule(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.payhubService.updateRule(id, body);
  }

  @Post('rule/:id/check-auto-approval')
  async checkAutoApproval(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.payhubService.checkAutoApproval(id, body.amount);
  }

  @Post('batch-settle')
  async batchSettle(@Body() body: { organizationId: string; settlementDate: string }) {
    return this.payhubService.executeBatchSettlement({
      organizationId: body.organizationId,
      settlementDate: new Date(body.settlementDate),
    });
  }

  @Get('reconciliation/pending')
  async getPendingReconciliation() {
    return this.payhubService.getPendingReconciliation();
  }

  @Get('liquidity-position')
  async getLiquidityPosition(@Query('organizationId') organizationId: string) {
    return this.payhubService.getLiquidityPosition(organizationId);
  }

  @Post('fraud-check')
  async detectFraud(@Body() body: {
    customerId: string;
    transactionPattern: { amount: number; frequency: number; merchants: number };
  }) {
    return this.payhubService.detectFraudAnomalies(body);
  }

  @Post('merchant-payout')
  async schedulePayout(@Body() body: {
    merchantId: string;
    frequency: string;
    nextPayoutDate: string;
  }) {
    return this.payhubService.schedulePayout({
      merchantId: body.merchantId,
      frequency: body.frequency,
      nextPayoutDate: new Date(body.nextPayoutDate),
    });
  }

  @Post('reserve-hold')
  async calculateReserveHold(@Body() body: {
    transactionVolume: number;
    fraudRatePct: number;
  }) {
    return this.payhubService.calculateReserveHold(body);
  }

  @Post('dispute')
  async createDispute(@Body() body: {
    transactionId: string;
    disputeReason: string;
    filedBy: string;
  }) {
    return this.payhubService.createDisputeCase(body);
  }

  @Post('optimize-settlement-currency')
  async optimizeSettlementCurrency(@Body() body: {
    amount: number;
    sourceCurrency: string;
    targetCurrencies: string[];
  }) {
    return this.payhubService.optimizeSettlementCurrency(body);
  }

  @Post('cross-border-route')
  async routeCrossBorder(@Body() body: {
    sourceCountry: string;
    destinationCountry: string;
    amount: number;
  }) {
    return this.payhubService.routeCrossBorder(body);
  }

  @Post('method-ranking')
  async rankPaymentMethods(@Body() body: {
    availableMethods: string[];
    amount: number;
    priority: 'cost' | 'speed' | 'reliability';
  }) {
    return this.payhubService.rankPaymentMethods(body);
  }

  @Post('invoice/generate')
  async generateInvoice(@Body() body: {
    merchantId: string;
    amount: number;
    currency: string;
    taxAmount?: number;
  }) {
    return this.payhubService.generateInvoice(body);
  }

  @Get('pci-compliance')
  async checkPciCompliance() {
    return this.payhubService.checkPciCompliance();
  }
}
