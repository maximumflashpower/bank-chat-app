import { Test, TestingModule } from '@nestjs/testing';
import { CreditScoringService } from './credit-scoring.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreditScore } from '../entities/credit-score.entity';

describe('CreditScoringService', () => {
  let service: CreditScoringService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data), // Fix: add create method
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditScoringService,
        { provide: getRepositoryToken(CreditScore), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreditScoringService>(CreditScoringService);
  });

  describe('calculateAndSaveScore', () => {
    it('should calculate and save credit score', async () => {
      const dto = {
        userId: 'user-123',
        bureauScore: 750,
        annualIncome: 80000,
        debtToIncome: 0.35,
      };

      mockRepo.save.mockResolvedValue({
        id: 'score-123',
        userId: dto.userId,
        overallScore: 720,
        riskSegment: 'low',
        calculatedAt: new Date(),
      });

      const result = await service.calculateAndSaveScore(dto as any);

      expect(result.overallScore).toBeDefined();
      expect(result.riskSegment).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByUserId', () => {
    it('should return score history for user', async () => {
      const scores = [
        { id: '1', userId: 'user-123', overallScore: 700, calculatedAt: new Date() },
        { id: '2', userId: 'user-123', overallScore: 720, calculatedAt: new Date() },
      ];

      mockRepo.find.mockResolvedValue(scores);

      const result = await service.findByUserId('user-123');

      expect(result.length).toBe(2);
      // Fix: Match actual implementation (calculatedAt, not createdAt)
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123' },
        order: { calculatedAt: 'DESC' },
        take: 5,
      }));
    });
  });

  describe('getLatestScore', () => {
    it('should return latest score for user', async () => {
      const latestScore = {
        id: 'latest',
        userId: 'user-123',
        overallScore: 750,
      };

      mockRepo.findOne.mockResolvedValue(latestScore);

      const result = await service.getLatestScore('user-123');

      expect(result.overallScore).toBe(750);
    });

    it('should return null if no score exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.getLatestScore('user-456');

      expect(result).toBeNull();
    });
  });
});
