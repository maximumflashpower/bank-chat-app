import { Test, TestingModule } from '@nestjs/testing';
import { ReconDashboardService } from './recon-dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';
import { ReconInterSystemBreak } from '../entities/recon-inter-system-break.entity';
import { ReconNettingBatch } from '../entities/recon-netting-batch.entity';

describe('ReconDashboardService', () => {
  let service: ReconDashboardService;
  let mockBatchRepo: any;
  let mockBreakRepo: any;
  let mockNettingRepo: any;

  beforeEach(async () => {
    mockBatchRepo = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
    };

    mockBreakRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    mockNettingRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconDashboardService,
        { provide: getRepositoryToken(ReconMatchingBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(ReconInterSystemBreak), useValue: mockBreakRepo },
        { provide: getRepositoryToken(ReconNettingBatch), useValue: mockNettingRepo },
      ],
    }).compile();

    service = module.get<ReconDashboardService>(ReconDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchRateKPIs', () => {
    it('should return KPI summary with match rate', async () => {
      mockBatchRepo.find.mockResolvedValue([
        { matchedCount: 80, unmatchedCountA: 10, unmatchedCountB: 10, processingTimeMs: 5000 },
        { matchedCount: 90, unmatchedCountA: 5, unmatchedCountB: 5, processingTimeMs: 3000 },
      ]);

      const result = await service.getMatchRateKPIs();

      expect(result.totalBatches).toBe(2);
      expect(result.completedBatches).toBe(2);
      expect(result.overallMatchRate).toBeGreaterThan(0);
      expect(result.trend).toEqual([]);
    });

    it('should return zero match rate when no batches', async () => {
      mockBatchRepo.find.mockResolvedValue([]);

      const result = await service.getMatchRateKPIs();

      expect(result.totalBatches).toBe(0);
      expect(result.overallMatchRate).toBe(0);
    });
  });

  describe('getRealtimeStatus', () => {
    it('should return realtime status summary', async () => {
      mockBatchRepo.count.mockResolvedValue(3);
      mockBreakRepo.count.mockResolvedValue(5);
      mockNettingRepo.count.mockResolvedValue(2);
      mockBatchRepo.findOne.mockResolvedValue({ batchNumber: 'BATCH-001' });

      const result = await service.getRealtimeStatus();

      expect(result.runningBatches).toBe(3);
      expect(result.openBreaks).toBe(5);
      expect(result.pendingNetting).toBe(2);
      expect(result.lastCompletedBatch).toBe('BATCH-001');
    });

    it('should return null for lastCompletedBatch when none exists', async () => {
      mockBatchRepo.count.mockResolvedValue(0);
      mockBreakRepo.count.mockResolvedValue(0);
      mockNettingRepo.count.mockResolvedValue(0);
      mockBatchRepo.findOne.mockResolvedValue(null);

      const result = await service.getRealtimeStatus();

      expect(result.lastCompletedBatch).toBeNull();
    });
  });

  describe('getExecutiveSummary', () => {
    it('should return executive summary with metrics', async () => {
      mockBatchRepo.find.mockResolvedValue([
        { matchedCount: 100, unmatchedCountA: 0, unmatchedCountB: 0 },
      ]);
      mockBreakRepo.find.mockResolvedValue([
        { id: '1', status: 'open', breakType: 'timing' },
        { id: '2', status: 'resolved', breakType: 'posting_error' },
      ]);
      mockNettingRepo.find.mockResolvedValue([
        { grossVolumeTotal: 50000, netVolumeTotal: 30000 },
      ]);

      const result = await service.getExecutiveSummary();

      expect(result.matchRatePercent).toBe(100);
      expect(result.outstandingBreaks).toBe(1);
      expect(result.breaksResolved).toBe(1);
      expect(result.nettingSavings).toBe(20000);
      expect(result.topIssues.length).toBeGreaterThan(0);
    });
  });
});
