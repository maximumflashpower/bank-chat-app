import { Test, TestingModule } from '@nestjs/testing';
import { MatchingEngineService } from './matching-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReconMatchingBatch } from '../entities/recon-matching-batch.entity';
import { ReconMatchingResult } from '../entities/recon-match-result.entity';

describe('MatchingEngineService', () => {
  let service: MatchingEngineService;
  let mockBatchRepo: any;
  let mockResultRepo: any;

  beforeEach(async () => {
    mockBatchRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockResultRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingEngineService,
        { provide: getRepositoryToken(ReconMatchingBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(ReconMatchingResult), useValue: mockResultRepo },
      ],
    }).compile();

    service = module.get<MatchingEngineService>(MatchingEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runBatch', () => {
    it('should create a batch and return it', async () => {
      const dto = {
        sourceSystemA: 'ledger',
        sourceSystemB: 'subledger',
        periodStartDate: new Date(),
        periodEndDate: new Date(),
        matchingAlgorithm: 'auto',
      };

      mockBatchRepo.create.mockReturnValue({ id: 'test-id' });
      mockBatchRepo.save.mockResolvedValue(dto);

      const result = await service.runBatch(dto as any, 'user-123');
      
      expect(mockBatchRepo.create).toHaveBeenCalled();
      expect(mockBatchRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('should return batch status by ID', async () => {
      mockBatchRepo.findOne.mockResolvedValue({ id: 'test-id', status: 'running' });

      const result = await service.getStatus('test-id');

      expect(mockBatchRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'test-id' },
      }));
      expect(result.status).toBe('running');
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockBatchRepo.findOne.mockResolvedValue(null);

      await expect(service.getStatus('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('manualMatch', () => {
    it('should create manual match result', async () => {
      const dto = {
        batchId: 'batch-123',
        sourceARefs: ['ref-a'],
        sourceBRefs: ['ref-b'],
        amountA: '100.00',
        amountB: '100.00',
        reasonCode: 'MANUAL_OVERRIDE',
      };

      mockResultRepo.create.mockReturnValue({ id: 'result-id' });
      mockResultRepo.save.mockResolvedValue(dto);

      const result = await service.manualMatch(dto, 'user-123');

      expect(mockResultRepo.create).toHaveBeenCalled();
      expect(mockResultRepo.save).toHaveBeenCalled();
    });
  });

  describe('manualUnmatch', () => {
    it('should unmatch a result', async () => {
      mockResultRepo.findOne.mockResolvedValue({ id: 'result-id', status: 'matched' });
      mockResultRepo.save.mockResolvedValue({ id: 'result-id', status: 'unmatched' });

      const result = await service.manualUnmatch('result-id', 'user-123');

      expect(result.status).toBe('unmatched');
    });
  });
});
