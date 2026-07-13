import { Test, TestingModule } from '@nestjs/testing';
import { NettingService } from './netting.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReconNettingBatch } from '../entities/recon-netting-batch.entity';

describe('NettingService', () => {
  let service: NettingService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettingService,
        { provide: getRepositoryToken(ReconNettingBatch), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NettingService>(NettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculate', () => {
    it('should create a netting batch', async () => {
      const dto = {
        nettingType: 'bilateral',
        periodDate: '2026-07-12',
        participants: [{ participantId: 'p1', grossObligation: '1000.00' }],
      };

      mockRepo.create.mockReturnValue({ id: 'netting-1' });
      mockRepo.save.mockResolvedValue({ id: 'netting-1', status: 'calculated' });

      const result = await service.calculate(dto as any, 'user-123');

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('netting-1');
    });
  });

  describe('execute', () => {
    it('should mark batch as executed', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'batch-1', status: 'calculated' });
      mockRepo.save.mockResolvedValue({ id: 'batch-1', status: 'executed' });

      const result = await service.execute('batch-1', 'user-123');

      expect(result.status).toBe('executed');
    });

    it('should throw if batch not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.execute('non-existent', 'user-123')).rejects.toThrow('not found');
    });
  });

  describe('cancel', () => {
    it('should cancel a non-posted batch', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'batch-1', postedToLedger: false });
      mockRepo.save.mockResolvedValue({ id: 'batch-1', status: 'cancelled' });

      const result = await service.cancel('batch-1');

      expect(result.status).toBe('cancelled');
    });

    it('should throw if batch already posted', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'batch-1', postedToLedger: true });

      await expect(service.cancel('batch-1')).rejects.toThrow('already posted');
    });
  });

  describe('postToLedger', () => {
    it('should mark batch as posted', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'batch-1', postedToLedger: false });
      mockRepo.save.mockResolvedValue({ id: 'batch-1', postedToLedger: true, status: 'posted' });

      const result = await service.postToLedger('batch-1');

      expect(result.postedToLedger).toBe(true);
      expect(result.status).toBe('posted');
    });
  });
});
