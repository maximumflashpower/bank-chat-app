import { Test, TestingModule } from '@nestjs/testing';
import { MarginCallService } from './margin-call.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MarginCall } from '../entities/margin-call.entity';
import { LoanMaster } from '../entities/loan-master.entity';
import { LoanCollateral } from '../entities/loan-collateral.entity';

describe('MarginCallService', () => {
  let service: MarginCallService;
  let mockMarginCallRepo: any;
  let mockLoanMasterRepo: any;
  let mockLoanCollateralRepo: any;

  beforeEach(async () => {
    mockMarginCallRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockLoanMasterRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockLoanCollateralRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarginCallService,
        { provide: getRepositoryToken(MarginCall), useValue: mockMarginCallRepo },
        { provide: getRepositoryToken(LoanMaster), useValue: mockLoanMasterRepo },
        { provide: getRepositoryToken(LoanCollateral), useValue: mockLoanCollateralRepo },
      ],
    }).compile();

    service = module.get<MarginCallService>(MarginCallService);
  });

  describe('getByLoanId', () => {
    it('should return margin calls for loan', async () => {
      const marginCalls = [
        { id: 'mc-1', loanId: 'loan-123', status: 'issued' },
        { id: 'mc-2', loanId: 'loan-123', status: 'resolved' },
      ];

      mockMarginCallRepo.find.mockResolvedValue(marginCalls);

      const result = await service.getByLoanId('loan-123');

      expect(result.length).toBe(2);
    });
  });

  describe('getActiveMarginCalls', () => {
    it('should return only active margin calls', async () => {
      const activeCalls = [
        { id: 'mc-1', status: 'issued' },
        { id: 'mc-2', status: 'acknowledged' },
      ];

      mockMarginCallRepo.find.mockResolvedValue(activeCalls);

      const result = await service.getActiveMarginCalls();

      expect(result.length).toBe(2);
    });
  });

  describe('acknowledgeMarginCall', () => {
    it('should acknowledge margin call with ISSUED status', async () => {
      const marginCall = {
        id: 'mc-1',
        status: 'issued',  // Fix: must be 'issued' not 'active'
        loanId: 'loan-123',
      };

      mockMarginCallRepo.findOne.mockResolvedValue(marginCall);
      mockMarginCallRepo.save.mockResolvedValue({ ...marginCall, status: 'acknowledged' });

      const result = await service.acknowledgeMarginCall('mc-1', 'user-456');

      expect(result.status).toBe('acknowledged');
    });

    it('should throw NotFoundException if margin call not found', async () => {
      mockMarginCallRepo.findOne.mockResolvedValue(null);

      await expect(service.acknowledgeMarginCall('invalid-id', 'user-456'))
        .rejects
        .toThrow('not found');
    });
  });

  describe('executeLiquidation', () => {
    it('should execute liquidation on acknowledged margin call', async () => {
      const marginCall = {
        id: 'mc-1',
        status: 'acknowledged',  // Fix: must be 'acknowledged' first
        loanId: 'loan-123',
      };

      const loan = {
        id: 'loan-123',
        loanNumber: 'LN-001',
      };

      mockMarginCallRepo.findOne.mockResolvedValue(marginCall);
      mockLoanMasterRepo.findOne.mockResolvedValue(loan);
      mockMarginCallRepo.save.mockResolvedValue({ ...marginCall, status: 'executed' });

      const result = await service.executeLiquidation('mc-1', 'admin-789');

      expect(result.status).toBe('executed');
    });
  });
});
