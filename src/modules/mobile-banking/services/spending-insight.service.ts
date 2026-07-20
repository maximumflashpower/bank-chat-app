import { Injectable } from '@nestjs/common';

@Injectable()
export class SpendingInsightService {
  async getCategorizedSpending(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ category: string; amount: number; merchant: string }[]> {
    return [
      { category: 'Food & Dining', amount: 450.00, merchant: 'Various Restaurants' },
      { category: 'Transportation', amount: 120.50, merchant: 'Gas Stations' },
      { category: 'Shopping', amount: 280.00, merchant: 'Retail Stores' },
    ];
  }

  async getMonthlyBudgetProgress(userId: string): Promise<{ target: number; spent: number; remaining: number }> {
    return { target: 3000, spent: 1840.50, remaining: 1159.50 };
  }

  async getSavingsGoalProgress(goalId: string): Promise<{ target: number; saved: number; percentComplete: number }> {
    return { target: 10000, saved: 4500, percentComplete: 45 };
  }

  async getCreditScore(userId: string): Promise<number> {
    return 720;
  }
}
