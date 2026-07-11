import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetHeader } from '../entities/budget-header.entity';
import { BudgetLineItem } from '../entities/budget-line-item.entity';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { BudgetStatus } from '../entities/budget-status.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetHeaderRepo: Repository<BudgetHeader>;
  let budgetLineItemRepo: Repository<BudgetLineItem>;

  const mockBudgetHeader = {
    id: 'budget-uuid-1',
    companyId: 'company-uuid-1',
    companyName: 'Test Corp',
    fiscalYear: 2026,
    currency: 'USD',
    status: BudgetStatus.DRAFT,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    totalBudgetedAmount: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: []
  };

  const mockBudgetLineItem = {
    id: 'line-item-uuid-1',
    budgetHeaderId: 'budget-uuid-1',
    month: 1,
    accountCategory: 'Office Supplies',
    description: 'Monthly office supplies',
    budgetedAmount: 5000,
    actualAmount: 4500,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getRepositoryToken(BudgetHeader),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(BudgetLineItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    budgetHeaderRepo = module.get<Repository<BudgetHeader>>(getRepositoryToken(BudgetHeader));
    budgetLineItemRepo = module.get<Repository<BudgetLineItem>>(getRepositoryToken(BudgetLineItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a budget successfully', async () => {
      const dto: CreateBudgetDto = {
        budgetName: 'FY2026 Budget',
        fiscalYear: 2026,
        companyId: 'company-uuid-1',
        currency: 'USD',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: BudgetStatus.DRAFT
      };

      jest.spyOn(budgetHeaderRepo, 'create').mockReturnValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValue(mockBudgetHeader as any);

      const result = await service.create(dto);

      expect(budgetHeaderRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        ...dto,
        status: BudgetStatus.DRAFT
      }));
      expect(budgetHeaderRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockBudgetHeader);
    });

    it('should set status to DRAFT if not provided', async () => {
      const dto: Partial<CreateBudgetDto> = {
        budgetName: 'FY2026 Budget',
        fiscalYear: 2026,
        companyId: 'company-uuid-1',
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      };

      jest.spyOn(budgetHeaderRepo, 'create').mockReturnValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValue(mockBudgetHeader as any);

      await service.create(dto as any);

      expect(budgetHeaderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: BudgetStatus.DRAFT })
      );
    });
  });

  describe('findAll', () => {
    it('should return all budgets for a company', async () => {
      const budgets = [mockBudgetHeader];
      jest.spyOn(budgetHeaderRepo, 'find').mockResolvedValue(budgets as any);

      const result = await service.findAll('company-uuid-1');

      expect(budgetHeaderRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'company-uuid-1' },
        relations: { lineItems: true }
      });
      expect(result).toEqual(budgets);
    });
  });

  describe('findById', () => {
    it('should return budget by id', async () => {
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(mockBudgetHeader as any);

      const result = await service.findById('budget-uuid-1');

      expect(budgetHeaderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'budget-uuid-1' },
        relations: { lineItems: true }
      });
      expect(result).toEqual(mockBudgetHeader);
    });

    it('should throw NotFoundException if budget not found', async () => {
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('non-existent')).rejects.toMatchObject({
        message: expect.stringContaining('not found')
      });
    });
  });

  describe('update', () => {
    it('should update budget successfully', async () => {
      const updateDto = { currency: 'EUR', comments: 'Updated comment' };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValue({ ...mockBudgetHeader, ...updateDto } as any);

      const result = await service.update('budget-uuid-1', updateDto);

      expect(budgetHeaderRepo.save).toHaveBeenCalled();
      expect(result.currency).toBe('EUR');
    });
  });

  describe('addLineItem', () => {
    it('should add line item to budget', async () => {
      const lineItemDto = {
        budgetHeaderId: 'budget-uuid-1',
        month: 1,
        accountCategory: 'Office Supplies',
        description: 'Test',
        budgetedAmount: 5000
      };

      jest.spyOn(budgetLineItemRepo, 'create').mockReturnValue(mockBudgetLineItem as any);
      jest.spyOn(budgetLineItemRepo, 'save').mockResolvedValue(mockBudgetLineItem as any);

      const result = await service.addLineItem(lineItemDto);

      expect(budgetLineItemRepo.create).toHaveBeenCalledWith(lineItemDto);
      expect(budgetLineItemRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockBudgetLineItem);
    });
  });

  describe('approveBudget', () => {
    it('should approve budget successfully', async () => {
      const approvedBudget = { ...mockBudgetHeader, status: BudgetStatus.APPROVED };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.approveBudget('budget-uuid-1', 'user-uuid-1');

      expect(result.status).toBe(BudgetStatus.APPROVED);
      expect(result.approvedBy).toBe('user-uuid-1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw ConflictException if already approved', async () => {
      const approvedBudget = { ...mockBudgetHeader, status: BudgetStatus.APPROVED };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(approvedBudget as any);

      await expect(service.approveBudget('budget-uuid-1', 'user-uuid-1'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('rejectBudget', () => {
    it('should reject budget with reason', async () => {
      const rejectedBudget = { ...mockBudgetHeader, status: BudgetStatus.REJECTED, comments: 'Insufficient funds' };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValue(rejectedBudget as any);

      const result = await service.rejectBudget('budget-uuid-1', 'Insufficient funds');

      expect(result.status).toBe(BudgetStatus.REJECTED);
      expect(result.comments).toBe('Insufficient funds');
    });
  });

  describe('archiveBudget', () => {
    it('should archive budget successfully', async () => {
      const archivedBudget = { ...mockBudgetHeader, status: BudgetStatus.ARCHIVED };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(mockBudgetHeader as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValue(archivedBudget as any);

      const result = await service.archiveBudget('budget-uuid-1');

      expect(result.status).toBe(BudgetStatus.ARCHIVED);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate variance correctly', async () => {
      const budgetWithLineItems = {
        ...mockBudgetHeader,
        lineItems: [
          { budgetedAmount: 5000, actualAmount: 4500 },
          { budgetedAmount: 3000, actualAmount: 3200 }
        ]
      };

      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(budgetWithLineItems as any);

      const result = await service.calculateVariance('budget-uuid-1');

      expect(result.totalBudgeted).toBe(8000);
      expect(result.totalActual).toBe(7700);
      expect(result.variance).toBe(300);
    });

    it('should handle empty line items', async () => {
      const budgetWithNoLines = { ...mockBudgetHeader, lineItems: [] };
      
      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(budgetWithNoLines as any);

      const result = await service.calculateVariance('budget-uuid-1');

      expect(result.totalBudgeted).toBe(0);
      expect(result.totalActual).toBe(0);
      expect(result.variance).toBe(0);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts for drafts and unapproved budgets', async () => {
      const drafts = [{ ...mockBudgetHeader, id: 'draft-1', status: BudgetStatus.DRAFT }];
      
      jest.spyOn(budgetHeaderRepo, 'find').mockResolvedValue(drafts as any);

      const alerts = await service.getAlerts('company-uuid-1');

      expect(alerts.length).toBe(1);
      expect(alerts[0].message).toContain('needs approval');
    });

    it('should not return alerts for approved budgets', async () => {
      const approved = [{ ...mockBudgetHeader, status: BudgetStatus.APPROVED }];
      
      jest.spyOn(budgetHeaderRepo, 'find').mockResolvedValue(approved as any);

      const alerts = await service.getAlerts('company-uuid-1');

      expect(alerts.length).toBe(0);
    });
  });

  describe('cloneBudget', () => {
    it('should clone budget with line items', async () => {
      const source = {
        ...mockBudgetHeader,
        lineItems: [mockBudgetLineItem]
      };
      const cloned = { ...mockBudgetHeader, id: 'cloned-uuid-1' };
      const clonedLineItem = { ...mockBudgetLineItem, budgetHeaderId: 'cloned-uuid-1' };

      jest.spyOn(budgetHeaderRepo, 'findOne').mockResolvedValue(source as any);
      jest.spyOn(budgetHeaderRepo, 'create').mockReturnValue(cloned as any);
      jest.spyOn(budgetHeaderRepo, 'save').mockResolvedValueOnce(cloned as any).mockResolvedValueOnce(cloned as any);
      jest.spyOn(budgetLineItemRepo, 'save').mockResolvedValue([clonedLineItem] as any);

      const result = await service.cloneBudget('budget-uuid-1', { fiscalYear: 2027 });

      expect(result.id).toBe('cloned-uuid-1');
      expect(budgetHeaderRepo.create).toHaveBeenCalled();
      expect(budgetLineItemRepo.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete budget successfully', async () => {
      jest.spyOn(budgetHeaderRepo, 'delete').mockResolvedValue({ affected: 1 } as any);

      await service.delete('budget-uuid-1');

      expect(budgetHeaderRepo.delete).toHaveBeenCalledWith('budget-uuid-1');
    });
  });
});
