import { Injectable, Logger } from '@nestjs/common';

export interface FraudAnalysisResult {
  fraudScore: number;
  decision: 'APPROVED' | 'DECLINED' | 'CHALLENGE';
  factors: string[];
  challengeMethod?: 'sms_otp' | 'push_app' | 'call_verification';
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  async analyzeTransaction(params: {
    cardId: string;
    amount: number;
    isInternational: boolean;
    isOnline: boolean;
    merchantCategory: string;
    location: string;
    deviceFingerprint: string;
    history: {
      avgTransactionAmount: number;
      typicalLocations: string[];
      typicalMerchants: string[];
      lastTransactionDate?: Date;
      dailyTransactionCount: number;
    };
  }): Promise<FraudAnalysisResult> {
    let score = 0;
    const factors: string[] = [];

    const { amount, isInternational, isOnline, location, history } = params;

    if (amount > history.avgTransactionAmount * 3) {
      score += 25;
      factors.push('HIGH_AMOUNT_VS_HISTORY');
    }

    if (amount > history.avgTransactionAmount * 10) {
      score += 25;
      factors.push('VERY_HIGH_AMOUNT');
    }

    if (isInternational && !history.typicalLocations.includes(location)) {
      score += 30;
      factors.push('UNUSUAL_LOCATION');
    }

    if (history.lastTransactionDate) {
      const minutesSinceLastTxn = (new Date().getTime() - history.lastTransactionDate.getTime()) / 60000;
      if (minutesSinceLastTxn < 30) {
        score += 20;
        factors.push('RAPID_SUCCESSION');
      }
    }

    if (history.dailyTransactionCount > 10) {
      score += 15;
      factors.push('HIGH_FREQUENCY');
    }

    if (isOnline && params.merchantCategory === 'gambling') {
      score += 20;
      factors.push('GAMBLING_MERCHANT');
    }

    if (score >= 70) {
      this.logger.warn(`High fraud risk detected: card=${params.cardId}, score=${score}`);
      return {
        fraudScore: score,
        decision: 'DECLINED',
        factors,
      };
    }

    if (score >= 40) {
      this.logger.warn(`Medium fraud risk: card=${params.cardId}, score=${score}`);
      return {
        fraudScore: score,
        decision: 'CHALLENGE',
        factors,
        challengeMethod: Math.random() > 0.5 ? 'sms_otp' : 'push_app',
      };
    }

    return {
      fraudScore: score,
      decision: 'APPROVED',
      factors,
    };
  }

  async calculateVelocityRisk(cardId: string, transactionsLastHour: number, transactionsLastDay: number): Promise<number> {
    let score = 0;

    if (transactionsLastHour > 5) {
      score += 25;
    }

    if (transactionsLastHour > 10) {
      score += 25;
    }

    if (transactionsLastDay > 30) {
      score += 20;
    }

    if (transactionsLastDay > 50) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  async updateFraudScore(cardId: string, previousScore: number, newScore: number): Promise<void> {
    if (newScore > previousScore + 30) {
      this.logger.warn(`Fraud score spike: card=${cardId}, previous=${previousScore}, current=${newScore}`);
    }
  }

  async getRiskProfile(cardId: string, days: number = 7): Promise<{
    totalTransactions: number;
    avgAmount: number;
    maxAmount: number;
    uniqueMerchants: number;
    countriesUsed: number;
    riskyTransactions: number;
  }> {
    return {
      totalTransactions: 0,
      avgAmount: 0,
      maxAmount: 0,
      uniqueMerchants: 0,
      countriesUsed: 0,
      riskyTransactions: 0,
    };
  }
}
