import { Test, TestingModule } from '@nestjs/testing';
import { SpendingInsightService } from './spending-insight.service';

describe('SpendingInsightService', () => {
  let service: SpendingInsightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpendingInsightService],
    }).compile();

    service = module.get<SpendingInsightService>(SpendingInsightService);
  });

  describe('getCategorizedSpending', () => {
    it('should return categorized spending summary', async () => {
      const result = await service.getCategorizedSpending('user-1', new Date(), new Date());

      expect(result).toContainEqual({
        category: 'Food & Dining',
        amount: 450.00,
        merchant: 'Various Restaurants',
      });
      expect(result).toContainEqual({
        category: 'Transportation',
        amount: 120.50,
        merchant: 'Gas Stations',
      });
      expect(result).toContainEqual({
        category: 'Shopping',
        amount: 280.00,
        merchant: 'Retail Stores',
      });
    });
  });

  describe('getMonthlyBudgetProgress', () => {
    it('should return budget progress', async () => {
      const result = await service.getMonthlyBudgetProgress('user-1');

      expect(result.target).toBe(3000);
      expect(result.spent).toBe(1840.50);
      expect(result.remaining).toBe(1159.50);
    });
  });

  describe('getSavingsGoalProgress', () => {
    it('should return savings goal progress', async () => {
      const result = await service.getSavingsGoalProgress('goal-1');

      expect(result.target).toBe(10000);
      expect(result.saved).toBe(4500);
      expect(result.percentComplete).toBe(45);
    });
  });

  describe('getCreditScore', () => {
    it('should return credit score', async () => {
      const result = await service.getCreditScore('user-1');

      expect(result).toBe(720);
    });
  });
});
