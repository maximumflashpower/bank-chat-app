import { Test, TestingModule } from '@nestjs/testing';
import { ChargeOffService } from './charge-off.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ChargeOffService', () => {
  let service: ChargeOffService;
  let mockLoanRepo: any;
  let mockScheduleRepo: any;

  beforeEach(async () => {
    mockLoanRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockScheduleRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargeOffService,
        { provide: getRepositoryToken(LoanMaster), useValue: mockLoanRepo },
        { provide: getRepositoryToken(LoanAmortizationSchedule), useValue: mockScheduleRepo },
      ],
    }).compile();

    service = module.get<ChargeOffService>(ChargeOffService);
  });

  describe('evaluateForChargeOff', () => {
    it('should recommend charge-off for loans >= 180 DPD', async () => {
      const loan = {
        id: 'test-loan',
        daysPastDue: 180,
        currentPrincipalBalance: 50000,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      const result = await service.evaluateForChargeOff(loan.id);

      expect(result.eligible).toBe(true);
      expect(result.recommendedAction).toBe('charge_off');
      expect(result.daysPastDue).toBe(180);
    });

    it('should recommend workout for loans 120-179 DPD', async () => {
      const loan = {
        id: 'test-loan',
        daysPastDue: 150,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      const result = await service.evaluateForChargeOff(loan.id);

      expect(result.eligible).toBe(false);
      expect(result.recommendedAction).toBe('workout');
    });

    it('should recommend continue_monitoring for loans < 90 DPD', async () => {
      const loan = {
        id: 'test-loan',
        daysPastDue: 60,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      const result = await service.evaluateForChargeOff(loan.id);

      expect(result.eligible).toBe(false);
      expect(result.recommendedAction).toBe('continue_monitoring');
    });
  });

  describe('processChargeOff', () => {
    it('should process charge-off successfully', async () => {
      const loan = {
        id: 'test-loan',
        status: 'active',
        currentPrincipalBalance: 50000,
        totalInterestPaid: 5000,
        loanNumber: 'LN-001',
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockLoanRepo.save.mockResolvedValue({ ...loan, status: 'charged_off' });
      mockScheduleRepo.find.mockResolvedValue([]);

      const result = await service.processChargeOff(loan.id, 5000);

      expect(result.writeOffAmount).toBeGreaterThan(50000);
      expect(result.chargedOffAt).toBeDefined();
      expect(mockLoanRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if loan already charged off', async () => {
      const loan = {
        id: 'test-loan',
        status: 'charged_off',
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      await expect(service.processChargeOff(loan.id))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('recordRecovery', () => {
    it('should record partial recovery', async () => {
      const loan = {
        id: 'test-loan',
        status: 'charged_off',
        payoffAmountCurrent: 5000,
        currentPrincipalBalance: 50000,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockLoanRepo.save.mockResolvedValue(loan);

      const result = await service.recordRecovery(loan.id, 2000);

      expect(result.recoveredAmount).toBe(2000);
      expect(result.totalRecoveredToDate).toBe(7000);
      expect(mockLoanRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if loan not charged off', async () => {
      const loan = {
        id: 'test-loan',
        status: 'active',
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);

      await expect(service.recordRecovery(loan.id, 1000))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});
