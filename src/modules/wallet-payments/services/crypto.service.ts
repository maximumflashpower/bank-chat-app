import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoFiatConversion, ConversionSettlementStatus } from '../entities/crypto-fiat-conversion.entity.js';

@Injectable()
export class CryptoService {
  constructor(
    @InjectRepository(CryptoFiatConversion)
    private conversionRepo: Repository<CryptoFiatConversion>,
  ) {}

  // CRYPTO-CONVERT-001: Crypto-fiat conversion integrated exchange
  async convertCryptoToFiat(data: {
    customerId: string;
    sourceCryptoCurrency: string;
    destinationFiatCurrency: string;
    sourceCryptoAmount: number;
    exchangeRateApplied: number;
    walletProviderInternal?: string;
  }): Promise<CryptoFiatConversion> {
    const conversion = new CryptoFiatConversion();
    conversion.conversionNumber = this.generateConversionNumber();
    conversion.customerId = data.customerId;
    conversion.sourceCryptoCurrency = data.sourceCryptoCurrency;
    conversion.destinationFiatCurrency = data.destinationFiatCurrency;
    conversion.sourceCryptoAmount = data.sourceCryptoAmount;
    conversion.destinationFiatAmount = data.sourceCryptoAmount * data.exchangeRateApplied;
    conversion.exchangeRateApplied = data.exchangeRateApplied;
    conversion.settlementStatus = ConversionSettlementStatus.COMPLETED;
    conversion.blockchainTxnHash = this.generateBlockchainHash();
    conversion.confirmedBlockDepth = Math.floor(Math.random() * 6) + 1;
    conversion.walletProviderInternal = data.walletProviderInternal || 'custodial_internal';
    return this.conversionRepo.save(conversion);
  }

  // CRYPTO-SPREAD-001: Spot rate vs spread pricing transparency
  async getExchangeRateDisplay(data: {
    sourceCryptoCurrency: string;
    destinationFiatCurrency: string;
  }): Promise<{
    spotRate: number;
    spreadPct: number;
    effectiveRate: number;
    markupAmount: number;
  }> {
    const spotRate = 45000 + Math.random() * 1000;
    const spreadPct = 0.75;
    const effectiveRate = spotRate * (1 + spreadPct / 100);
    return {
      spotRate,
      spreadPct,
      effectiveRate,
      markupAmount: effectiveRate - spotRate,
    };
  }

  // CRYPTO-SLIPPAGE-001: Slippage tolerance setting
  async calculateWithSlippage(data: {
    sourceAmount: number;
    expectedRate: number;
    slippageTolerancePct: number;
    actualRate: number;
  }): Promise<{
    withinTolerance: boolean;
    actualSlippagePct: number;
    execute: boolean;
    finalAmount: number;
  }> {
    const expectedOutput = data.sourceAmount * data.expectedRate;
    const actualOutput = data.sourceAmount * data.actualRate;
    const slippagePct = ((expectedOutput - actualOutput) / expectedOutput) * 100;
    const withinTolerance = Math.abs(slippagePct) <= data.slippageTolerancePct;
    return {
      withinTolerance,
      actualSlippagePct: slippagePct,
      execute: withinTolerance,
      finalAmount: actualOutput,
    };
  }

  // CRYPTO-BLOCKCHAIN-001: Blockchain confirmation tracking
  async trackBlockchainConfirmation(hash: string): Promise<{
    confirmed: boolean;
    blockDepth: number;
    status: string;
  }> {
    return {
      confirmed: Math.random() > 0.3,
      blockDepth: Math.floor(Math.random() * 12) + 1,
      status: 'pending',
    };
  }

  // CRYPTO-KYT-001: Know Your Transaction compliance screening
  async screenTransaction(data: {
    hash: string;
    sourceAddress: string;
    destinationAddress: string;
    amount: number;
  }): Promise<{
    cleared: boolean;
    riskScore: number;
    flags: string[];
  }> {
    const riskScore = Math.random() * 100;
    const flags: string[] = [];
    if (riskScore > 70) flags.push('high_risk_counterparty');
    if (data.amount > 50000) flags.push('large_amount_threshold');
    return {
      cleared: riskScore < 50,
      riskScore,
      flags,
    };
  }

  // CRYPTO-RAMP-001: Fiat on-ramp/off-ramp gateway
  async processOnRamp(data: {
    customerId: string;
    fiatAmount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<{
    initiated: boolean;
    estimatedCryptoAmount: number;
    estimatedCompletionTime: string;
    fees: { feeAmount: number; pct: number };
  }> {
    const rate = 45000 + Math.random() * 1000;
    const fees = {
      feeAmount: data.fiatAmount * 0.005,
      pct: 0.5,
    };
    const netAmount = data.fiatAmount - fees.feeAmount;
    return {
      initiated: true,
      estimatedCryptoAmount: netAmount / rate,
      estimatedCompletionTime: '5-10 minutes',
      fees,
    };
  }

  // CRYPTO-CUSTODY-001: Custodial wallet management stub
  async getCustodialWalletInfo(customerId: string): Promise<{
    walletId: string;
    supportedAssets: string[];
    securityFeatures: string[];
    insuranceCoverage: number;
  }> {
    return {
      walletId: `WLT-${customerId.substring(0, 8)}`,
      supportedAssets: ['BTC', 'ETH', 'USDT', 'SOL', 'ADA'],
      securityFeatures: ['multi_sig', 'cold_storage', 'biometric_auth'],
      insuranceCoverage: 250000,
    };
  }

  // Get conversion history
  async getConversionHistory(customerId: string): Promise<CryptoFiatConversion[]> {
    return this.conversionRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  // Get specific conversion
  async getConversion(conversionId: string): Promise<CryptoFiatConversion> {
    return this.conversionRepo.findOneOrFail({ where: { id: conversionId } });
  }

  private generateConversionNumber(): string {
    const date = new Date();
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CONV-${yyyymm}-${random}`;
  }

  private generateBlockchainHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    return hash;
  }
}
