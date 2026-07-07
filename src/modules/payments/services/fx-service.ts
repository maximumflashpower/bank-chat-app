import { Injectable } from '@nestjs/common';

interface FxRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  spread: number;
  provider: string;
  timestamp: Date;
}

const fxRatesStore: FxRate[] = [
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, spread: 0.015, provider: 'ProviderA', timestamp: new Date() },
  { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09, spread: 0.015, provider: 'ProviderA', timestamp: new Date() },
  { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, spread: 0.012, provider: 'ProviderB', timestamp: new Date() },
  { fromCurrency: 'MXN', toCurrency: 'USD', rate: 0.058, spread: 0.025, provider: 'ProviderA', timestamp: new Date() },
];

@Injectable()
export class FxService {
  queryRate(fromCurrency: string, toCurrency: string, amount: number): {
    rate: number;
    convertedAmount: number;
    provider: string;
    spread: number;
  } {
    const rates = fxRatesStore.filter(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
    
    if (rates.length === 0) {
      return {
        rate: 1,
        convertedAmount: amount,
        provider: 'DEFAULT',
        spread: 0.05,
      };
    }

    const bestRate = rates.reduce((best, current) =>
      current.rate > best.rate ? current : best
    );

    return {
      rate: bestRate.rate,
      convertedAmount: amount * bestRate.rate,
      provider: bestRate.provider,
      spread: bestRate.spread,
    };
  }

  async convert(fromCurrency: string, toCurrency: string, amount: number, instructionId: string, authorizedBy: string): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    gainLoss: number;
  }> {
    const quote = this.queryRate(fromCurrency, toCurrency, amount);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: quote.convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: quote.rate,
      gainLoss: 0,
    };
  }

  async getExposureReport(): Promise<{
    currencies: Array<{ currency: string; exposure: number; direction: string }>;
    totalEquivalent: number;
    riskScore: number;
  }> {
    return {
      currencies: [
        { currency: 'EUR', exposure: 500000, direction: 'LONG' },
        { currency: 'GBP', exposure: 250000, direction: 'SHORT' },
        { currency: 'MXN', exposure: 1000000, direction: 'LONG' },
      ],
      totalEquivalent: 1200000,
      riskScore: 3.5,
    };
  }
}
