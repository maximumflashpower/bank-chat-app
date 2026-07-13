import { Test, TestingModule } from '@nestjs/testing';
import { SettlementOptimizerService } from './settlement-optimizer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReconSettlementBatch } from '../entities/recon-settlement-batch.entity';

describe('SettlementOptimizerService', () => {
  let service: SettlementOptimizerService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementOptimizerService,
        { provide: getRepositoryToken(ReconSettlementBatch), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SettlementOptimizerService>(SettlementOptimizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('optimizeBatch', () => {
    it('should create and save optimized batch', async () => {
      const dto = {
        optimizationStrategy: 'cost_minimization',
        bankChannel: 'SWIFT',
        currencyCode: 'USD',
        payments: [{ paymentId: 'p1', amount: '1000.00' }],
      };

      mockRepo.create.mockReturnValue({ id: 'sb-1' });
      mockRepo.save.mockResolvedValue({ id: 'sb-1', status: 'optimized' });

      const result = await service.optimizeBatch(dto as any, 'user-123');

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result.id).toBe('sb-1');
    });
  });

  describe('getBatch', () => {
    it('should return batch by ID', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'sb-1', status: 'optimized' });

      const result = await service.getBatch('sb-1');

      expect(result.id).toBe('sb-1');
    });

    it('should throw if batch not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getBatch('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('sendBatch', () => {
    it('should mark batch as sent', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'sb-1', status: 'optimized' });
      mockRepo.save.mockResolvedValue({ id: 'sb-1', status: 'sent' });

      const result = await service.sendBatch('sb-1');

      expect(result.status).toBe('sent');
    });
  });

  describe('acknowledgeBatch', () => {
    it('should acknowledge batch with bank reference', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'sb-1', status: 'sent' });
      mockRepo.save.mockResolvedValue({ id: 'sb-1', status: 'acknowledged', bankReference: 'REF-123' });

      const result = await service.acknowledgeBatch('sb-1', 'REF-123');

      expect(result.status).toBe('acknowledged');
      expect(result.bankReference).toBe('REF-123');
    });
  });

  describe('getSavingsReport', () => {
    it('should return savings analysis', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'sb-1',
        totalFeesEstimated: 80,
        optimizationSavings: 20,
      });

      const result = await service.getSavingsReport('sb-1');

      expect(result.grossCost).toBe(100);
      expect(result.optimizedCost).toBe(80);
      expect(result.savings).toBe(20);
      expect(result.savingsPct).toBe(20);
    });
  });
});
