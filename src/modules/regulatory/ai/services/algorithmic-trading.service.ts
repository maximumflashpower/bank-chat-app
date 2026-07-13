import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlgorithmicTradingService {
  private readonly logger = new Logger(AlgorithmicTradingService.name);

  // Simulated trading circuit breaker thresholds
  private readonly circuitBreakers = {
    dailyLossLimit: 0.05, // 5% daily loss limit
    positionLimit: 0.1,   // 10% portfolio concentration
    speedLimitMs: 100,    // Minimum order submission interval
  };

  /**
   * REG-MOD-002: Algorithmic trading oversight and controls
   */
  async overseeAlgoTrade(
    tradeStrategy: {
      name: string;
      strategyType: string;
      dailyPnL: number;
      portfolioConcentration: number;
      averageOrderIntervalMs: number;
    },
  ): Promise<{
    tradeId: string;
    strategyName: string;
    status: 'approved' | 'warned' | 'blocked';
    alerts: string[];
    actionsTaken: string[];
  }> {
    const alerts: string[] = [];
    const actionsTaken: string[] = [];

    // Check daily loss limit
    if (tradeStrategy.dailyPnL < -this.circuitBreakers.dailyLossLimit) {
      alerts.push(`Daily loss exceeded: ${(tradeStrategy.dailyPnL * 100).toFixed(2)}%`);
      actionsTaken.push('Circuit breaker triggered - halted trading');
    }

    // Check position concentration
    if (tradeStrategy.portfolioConcentration > this.circuitBreakers.positionLimit) {
      alerts.push(`Position limit exceeded: ${(tradeStrategy.portfolioConcentration * 100).toFixed(2)}%`);
      actionsTaken.push('Reducing position size');
    }

    // Check order frequency
    if (tradeStrategy.averageOrderIntervalMs < this.circuitBreakers.speedLimitMs) {
      alerts.push(`Too many orders: ${(1000 / tradeStrategy.averageOrderIntervalMs).toFixed(0)}/sec`);
      actionsTaken.push('Rate limiting applied');
    }

    const status: 'approved' | 'warned' | 'blocked' = actionsTaken.length >= 2 ? 'blocked' : actionsTaken.length >= 1 ? 'warned' : 'approved';

    const result = {
      tradeId: `ALGO-${Date.now()}`,
      strategyName: tradeStrategy.name,
      status,
      alerts,
      actionsTaken,
    };

    if (alerts.length > 0) {
      this.logger.warn(`Algo trading oversight for ${tradeStrategy.name}: ${alerts.join(', ')}`);
    }

    return result;
  }
}
