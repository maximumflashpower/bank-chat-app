import { Test, TestingModule } from '@nestjs/testing';
import { LoanRestructureService } from './loan-restructure.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoanRestructure } from '../entities/loan-restructure.entity';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanAmortizationSchedule } from '../entities/loan-amortization-schedule.entity';

describe('LoanRestructureService', () => {
  let service: LoanRestructureService;
  let mockRestructureRepo: any;
  let mockLoanRepo: any;
  let mockScheduleRepo: any;

  beforeEach(async () => {
    mockRestructureRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockLoanRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    mockScheduleRepo = {
      delete: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),  // Fix: add findOne method
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanRestructureService,
        { provide: getRepositoryToken(LoanRestructure), useValue: mockRestructureRepo },
        { provide: getRepositoryToken(LoanMaster), useValue: mockLoanRepo },
        { provide: getRepositoryToken(LoanAmortizationSchedule), useValue: mockScheduleRepo },
      ],
    }).compile();

    service = module.get<LoanRestructureService>(LoanRestructureService);
  });

  describe('proposeRestructure', () => {
    it('should create restructure proposal', async () => {
      const loan = {
        id: 'loan-123',
        currentPrincipalBalance: 100000,
        interestRate: 0.05,
        loanNumber: 'LN-001',
      };

      const dto = {
        reason: 'hardship',
        newTermMonths: 360,
        newInterestRate: 0.04,
      };

      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockScheduleRepo.findOne.mockResolvedValue(null);  // No existing schedule
      mockRestructureRepo.save.mockResolvedValue({
        id: 'restructure-123',
        loanId: 'loan-123',
        status: 'pending',
      });

      const result = await service.proposeRestructure('loan-123', dto as any);

      expect(result.status).toBe('pending');
      expect(mockRestructureRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if loan not found', async () => {
      mockLoanRepo.findOne.mockResolvedValue(null);

      const dto = { reason: 'hardship' } as any;

      await expect(service.proposeRestructure('invalid-id', dto))
        .rejects
        .toThrow('not found');
    });
  });

  describe('approveRestructure', () => {
    it('should approve restructure proposal', async () => {
      const restructure = {
        id: 'restructure-123',
        status: 'pending',
        loanId: 'loan-123',
      };

      mockRestructureRepo.findOne.mockResolvedValue(restructure);
      mockRestructureRepo.save.mockResolvedValue({ ...restructure, status: 'approved' });

      const result = await service.approveRestructure('restructure-123', 'manager-456');

      expect(result.status).toBe('approved');
    });

    it('should throw BadRequestException if not pending', async () => {
      const restructure = {
        id: 'restructure-123',
        status: 'approved',
      };

      mockRestructureRepo.findOne.mockResolvedValue(restructure);

      await expect(service.approveRestructure('restructure-123', 'manager-456'))
        .rejects
        .toThrow('Cannot approve');
    });
  });

  describe('rejectRestructure', () => {
    it('should reject restructure proposal', async () => {
      const restructure = {
        id: 'restructure-123',
        status: 'pending',
        loanId: 'loan-123',
      };

      mockRestructureRepo.findOne.mockResolvedValue(restructure);
      mockRestructureRepo.save.mockResolvedValue({ ...restructure, status: 'rejected' });

      const result = await service.rejectRestructure('restructure-123', 'manager-456', 'Insufficient income');

      expect(result.status).toBe('rejected');
    });
  });

  describe('applyRestructure', () => {
    it('should apply approved restructure to loan', async () => {
      const restructure = {
        id: 'restructure-123',
        status: 'approved',
        loanId: 'loan-123',
        newTermMonths: 360,
        newInterestRate: 0.04,
        newRate: 0.04,
      };

      const loan = {
        id: 'loan-123',
        interestRate: 0.05,
        loanNumber: 'LN-001',
      };

      mockRestructureRepo.findOne.mockResolvedValue(restructure);
      mockLoanRepo.findOne.mockResolvedValue(loan);
      mockLoanRepo.update.mockResolvedValue({ affected: 1 });
      mockRestructureRepo.save.mockResolvedValue({ ...restructure, status: 'effective' });

      const result = await service.applyRestructure('restructure-123');

      expect(mockLoanRepo.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if not approved', async () => {
      const restructure = {
        id: 'restructure-123',
        status: 'pending',
      };

      mockRestructureRepo.findOne.mockResolvedValue(restructure);

      await expect(service.applyRestructure('restructure-123'))
        .rejects
        .toThrow('approved');
    });
  });

  describe('getByLoanId', () => {
    it('should return restructures for loan', async () => {
      const restructures = [
        { id: 'rs-1', loanId: 'loan-123', status: 'pending' },
        { id: 'rs-2', loanId: 'loan-123', status: 'approved' },
      ];

      mockRestructureRepo.find.mockResolvedValue(restructures);

      const result = await service.getByLoanId('loan-123');

      expect(result.length).toBe(2);
    });
  });

  describe('getPendingRestructures', () => {
    it('should return only pending restructures', async () => {
      const pending = [
        { id: 'rs-1', status: 'pending' },
        { id: 'rs-2', status: 'pending' },
      ];

      mockRestructureRepo.find.mockResolvedValue(pending);

      const result = await service.getPendingRestructures();

      expect(result.length).toBe(2);
    });
  });
});
