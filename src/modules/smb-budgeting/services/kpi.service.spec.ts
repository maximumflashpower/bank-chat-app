import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiService } from './kpi.service';
import { BudgetHeader } from '../entities/budget-header.entity';
import { ProjectRegistry } from '../entities/project-registry.entity';
import { BudgetStatus } from '../entities/budget-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('KpiService', () => {
  let service: KpiService;
  let budgetRepo: Repository<BudgetHeader>;
  let projectRepo: Repository<ProjectRegistry>;

  const mockBudget = {
    id: 'budget-uuid-1',
    companyId: 'company-uuid-1',
    fiscalYear: 2026,
    status: BudgetStatus.APPROVED,
    totalBudgetedAmount: 100000,
    lineItems: [
      { budgetedAmount: 5000, actualAmount: 4500 },
      { budgetedAmount: 3000, actualAmount: 3200 }
    ]
  };

  const mockProjects = [
    { id: 'p1', companyName: 'Project Alpha', status: 'executing', budgetedAmount: 50000, actualCost: 25000, riskLevel: 'low' },
    { id: 'p2', companyName: 'Project Beta', status: 'planning', budgetedAmount: 30000, actualCost: 0, riskLevel: 'high' }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: getRepositoryToken(BudgetHeader),
          useValue: { find: jest.fn(), findOne: jest.fn() }
        },
        {
          provide: getRepositoryToken(ProjectRegistry),
          useValue: { find: jest.fn() }
        }
      ]
    }).compile();

    service = module.get<KpiService>(KpiService);
    budgetRepo = module.get<Repository<BudgetHeader>>(getRepositoryToken(BudgetHeader));
    projectRepo = module.get<Repository<ProjectRegistry>>(getRepositoryToken(ProjectRegistry));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      jest.spyOn(budgetRepo, 'find').mockResolvedValue([mockBudget] as any);
      jest.spyOn(projectRepo, 'find').mockResolvedValue(mockProjects as any);

      const result = await service.getDashboard('company-uuid-1');

      expect(result.totalBudgeted).toBe(100000);
      expect(result.totalActual).toBe(7700);
      expect(result.activeProjects).toBe(1);
      expect(result.overallVariance).toBe(100000 - 7700);
    });

    it('should handle no budgets', async () => {
      jest.spyOn(budgetRepo, 'find').mockResolvedValue([] as any);
      jest.spyOn(projectRepo, 'find').mockResolvedValue([] as any);

      const result = await service.getDashboard('company-uuid-1');

      expect(result.totalBudgeted).toBe(0);
      expect(result.activeProjects).toBe(0);
    });
  });

  describe('getBudgetUtilization', () => {
    it('should return utilization metrics', async () => {
      jest.spyOn(budgetRepo, 'findOne').mockResolvedValue(mockBudget as any);

      const result = await service.getBudgetUtilization('budget-uuid-1');

      expect(result.utilized).toBe(7700);
      expect(result.remaining).toBe(100000 - 7700);
      expect(result.percentage).toBeCloseTo(7.7, 1);
    });

    it('should throw NotFoundException if budget not found', async () => {
      jest.spyOn(budgetRepo, 'findOne').mockResolvedValue(null);
      await expect(service.getBudgetUtilization('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateForecast', () => {
    it('should return forecast with variance', async () => {
      jest.spyOn(budgetRepo, 'find').mockResolvedValue([mockBudget] as any);

      const periods = [
        { period: '2026-07', projectedValue: 10000 },
        { period: '2026-08', projectedValue: 12000 }
      ];

      const result = await service.updateForecast('company-uuid-1', periods);

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2026-07');
      expect(result[0].variance).toBeDefined();
    });
  });

  describe('getProjectHealthReport', () => {
    it('should return health report for all projects', async () => {
      jest.spyOn(projectRepo, 'find').mockResolvedValue(mockProjects as any);

      const result = await service.getProjectHealthReport('company-uuid-1');

      expect(result).toHaveLength(2);
      expect(result[0].budgetUtilization).toBeCloseTo(50, 0);
    });
  });
});
