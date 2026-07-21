import { Test, TestingModule } from '@nestjs/testing';
import { InterestAccrualService } from './interest-accrual.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity';
import { NotFoundException } from '@nestjs/common';

describe('InterestAccrualService', () => {
  let service: InterestAccrualService;
  let mockLoanRepo: any;
  let mockScheduleRepo: any;

  beforeEach(async () => {
    mockLoanRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    mockScheduleRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestAccrualService,
        { provide: getRepositoryToken(LoanMaster), useValue: mockLoanRepo },
        { provide: getRepositoryToken(LoanAmortizationSchedule), useValue: mockScheduleRepo },
      ],
    }).compile();

    service = module.get<InterestAccrualService>(InterestAccrualService);
  });

  describe('calculateDailyInterest', () => {
    it('should calculate daily interest correctly', async () => {
      const loan = {
        id: 'test-loan-id',
        currentInterestRate: 0.05,
        currentPrincipalBalance: 100000,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      const result = await service.calculateDailyInterest(loan.id);

      expect(result.dailyInterest).toBeCloseTo(13.7, 2); // (100000 * 0.05) / 365
      expect(result.currentBalance).toBe(100000);
      expect(result.rateUsed).toBe(0.05);
      expect(mockLoanRepo.findOne).toHaveBeenCalledWith({ where: { id: loan.id } });
    });

    it('should throw NotFoundException if loan not found', async () => {
      mockLoanRepo.findOne.mockResolvedValue(null);

      await expect(service.calculateDailyInterest('invalid-id'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('processAccrual', () => {
    it('should process accrual for active loan', async () => {
      const loan = {
        id: 'test-loan-id',
        status: 'active',
        currentInterestRate: 0.05,
        currentPrincipalBalance: 100000,
        payoffAmountCurrent: 100000,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockLoanRepo.save.mockResolvedValue({ ...loan, payoffAmountCurrent: 100013.7 });

      const result = await service.processAccrual(loan.id, 1);

      expect(result.accruedInterest).toBeCloseTo(13.7, 2);
      expect(mockLoanRepo.save).toHaveBeenCalled();
    });

    it('should return zero for inactive loans', async () => {
      const loan = {
        id: 'test-loan-id',
        status: 'paid_off',
        currentPrincipalBalance: 0,
        originalBalance: 100000,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      const result = await service.processAccrual(loan.id);

      expect(result.accruedInterest).toBe(0);
    });
  });
});
