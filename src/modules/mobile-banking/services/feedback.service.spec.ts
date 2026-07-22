import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { Repository } from 'typeorm';
import { MobileFeedback } from '../entities/mobile-feedback.entity';
import { FeedbackStatus } from '../enums/mobile.enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repo: Repository<MobileFeedback>;

  const mockFeedback = {
    id: 'fb-1',
    userId: 'user-1',
    rating: 4,
    feedbackType: 'ui_experience',
    comment: 'Great app, very intuitive',
    status: FeedbackStatus.OPEN,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(MobileFeedback),
          useValue: {
            save: jest.fn((input) => Promise.resolve({ ...input, id: 'fb-1', status: FeedbackStatus.OPEN, createdAt: new Date() })),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    repo = module.get<Repository<MobileFeedback>>(getRepositoryToken(MobileFeedback));
  });

  describe('submit', () => {
    it('should submit feedback successfully', async () => {
      const input = {
        userId: 'user-1',
        rating: 4,
        feedbackType: 'ui_experience',
        comment: 'Great app, very intuitive',
      };

      const result = await service.submit(input);

      expect(result.rating).toBe(4);
      expect(result.status).toBe(FeedbackStatus.OPEN);
    });

    it('should include optional fields when provided', async () => {
      const input = {
        userId: 'user-1',
        rating: 5,
        feedbackType: 'feature_request',
        comment: 'Need dark mode',
        screenContext: 'settings',
        deviceInfo: { platform: 'ios', version: '17.0' },
      };

      const result = await service.submit(input);

      expect(result.screenContext).toBe('settings');
      expect(result.deviceInfo).toEqual({ platform: 'ios', version: '17.0' });
    });
  });

  describe('getAll', () => {
    it('should return all feedback without filter', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockFeedback as any]);

      const result = await service.getAll();

      expect(result).toHaveLength(1);
    });

    it('should filter by status if provided', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockFeedback as any]);

      const result = await service.getAll(FeedbackStatus.OPEN);

      expect(result).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update feedback status', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockFeedback as any);
      jest.spyOn(repo, 'save').mockImplementation((fb) => Promise.resolve({ ...fb, status: FeedbackStatus.RESOLVED } as any));

      const result = await service.updateStatus('fb-1', FeedbackStatus.RESOLVED);

      expect(result.status).toBe(FeedbackStatus.RESOLVED);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.updateStatus('fb-999', FeedbackStatus.RESOLVED))
        .rejects.toThrow(NotFoundException);
    });
  });
});
