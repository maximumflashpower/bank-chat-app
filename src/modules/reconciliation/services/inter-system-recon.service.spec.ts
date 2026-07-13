import { Test, TestingModule } from '@nestjs/testing';
import { InterSystemReconService } from './inter-system-recon.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReconInterSystemBreak } from '../entities/recon-inter-system-break.entity';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';

describe('InterSystemReconService', () => {
  let service: InterSystemReconService;
  let mockBreakRepo: any;
  let mockBatchRepo: any;

  beforeEach(async () => {
    mockBreakRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockBatchRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterSystemReconService,
        { provide: getRepositoryToken(ReconInterSystemBreak), useValue: mockBreakRepo },
        { provide: getRepositoryToken(ReconMatchingBatch), useValue: mockBatchRepo },
      ],
    }).compile();

    service = module.get<InterSystemReconService>(InterSystemReconService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run', () => {
    it('should create and execute inter-system reconciliation', async () => {
      const dto = {
        accountId: 'acc-123',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
      };

      mockBatchRepo.create.mockReturnValue({ id: 'is-batch-1' });
      mockBatchRepo.save.mockResolvedValue({ id: 'is-batch-1', status: 'completed' });

      const result = await service.run(dto as any, 'user-123');

      expect(mockBatchRepo.create).toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });
  });

  describe('getBreaks', () => {
    it('should return breaks for a batch', async () => {
      mockBreakRepo.find.mockResolvedValue([{ id: 'break-1', status: 'open' }]);

      const result = await service.getBreaks('batch-1');

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('open');
    });
  });

  describe('resolveBreak', () => {
    it('should resolve a break', async () => {
      mockBreakRepo.findOne.mockResolvedValue({ id: 'break-1', status: 'open' });
      mockBreakRepo.save.mockResolvedValue({ id: 'break-1', status: 'resolved' });

      const result = await service.resolveBreak('break-1', 'adjusted', 'user-123');

      expect(result.status).toBe('resolved');
    });
  });

  describe('escalateBreak', () => {
    it('should escalate a break to high severity', async () => {
      mockBreakRepo.findOne.mockResolvedValue({ id: 'break-1', breakSeverity: 'low' });
      mockBreakRepo.save.mockResolvedValue({ id: 'break-1', breakSeverity: 'high', status: 'escalated' });

      const result = await service.escalateBreak('break-1', 'Critical variance detected');

      expect(result.breakSeverity).toBe('high');
      expect(result.status).toBe('escalated');
    });
  });

  describe('getBreakMetrics', () => {
    it('should return metrics summary', async () => {
      mockBreakRepo.find.mockResolvedValue([
        { id: '1', status: 'open' },
        { id: '2', status: 'open' },
        { id: '3', status: 'resolved' },
      ]);

      const result = await service.getBreakMetrics('batch-1');

      expect(result.total).toBe(3);
      expect(result.open).toBe(2);
      expect(result.resolved).toBe(1);
    });
  });
});
