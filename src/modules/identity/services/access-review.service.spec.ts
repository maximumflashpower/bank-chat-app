// Mock entities
jest.mock('../entities/access-review.entity');

import { AccessReviewService } from './access-review.service';
import { AccessReviewStatus } from '../entities/access-review-status.enum';

describe('AccessReviewService', () => {
  let service: AccessReviewService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    service = new AccessReviewService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================
  // createReview()
  // ===========================

  describe('createReview', () => {
    const dto = {
      campaignName: 'Q3 Audit',
      targetUserIds: ['user-1', 'user-2'],
      dueDate: '2026-09-30',
      justification: 'Quarterly review',
    };

    it('should create a review with PENDING status', async () => {
      const mockReview = { id: 'rev-1', ...dto, status: AccessReviewStatus.PENDING };
      repo.create.mockReturnValue(mockReview);
      repo.save.mockResolvedValue(mockReview);

      const result = await service.createReview(dto);

      expect(result).toBe(mockReview);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignName: 'Q3 Audit',
          status: AccessReviewStatus.PENDING,
          reviewerId: '',
          completedAt: null,
          remediatedAt: null,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(mockReview);
    });

    it('should set justification to null when not provided', async () => {
      repo.create.mockReturnValue({ id: 'rev-1' });
      repo.save.mockResolvedValue({ id: 'rev-1' });

      await service.createReview({
        campaignName: 'Audit',
        targetUserIds: ['u1'],
        dueDate: '2026-12-31',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ justification: null }),
      );
    });

    it('should parse dueDate string to Date object', async () => {
      repo.create.mockReturnValue({ id: 'rev-1' });
      repo.save.mockResolvedValue({ id: 'rev-1' });

      await service.createReview({
        campaignName: 'Audit',
        targetUserIds: ['u1'],
        dueDate: '2026-09-30',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: expect.any(Date) }),
      );
    });
  });

  // ===========================
  // submitReview()
  // ===========================

  describe('submitReview', () => {
    it('should update status to COMPLETED and return updated review', async () => {
      const mockReview = { id: 'rev-1', status: AccessReviewStatus.COMPLETED, completedAt: new Date() };
      repo.update.mockResolvedValue(undefined);
      repo.findOneOrFail.mockResolvedValue(mockReview);

      const result = await service.submitReview({ reviewId: 'rev-1' });

      expect(result).toBe(mockReview);
      expect(repo.update).toHaveBeenCalledWith('rev-1',
        expect.objectContaining({
          status: AccessReviewStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );
      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'rev-1' } });
    });
  });

  // ===========================
  // getPendingReviews()
  // ===========================

  describe('getPendingReviews', () => {
    it('should return pending reviews ordered by dueDate ASC', async () => {
      const mockReviews = [
        { id: 'rev-1', status: AccessReviewStatus.PENDING, dueDate: new Date('2026-08-01') },
        { id: 'rev-2', status: AccessReviewStatus.PENDING, dueDate: new Date('2026-09-01') },
      ];
      repo.find.mockResolvedValue(mockReviews);

      const result = await service.getPendingReviews();

      expect(result).toBe(mockReviews);
      expect(repo.find).toHaveBeenCalledWith({
        where: { status: AccessReviewStatus.PENDING },
        order: { dueDate: 'ASC' },
      });
    });

    it('should return empty array when no pending reviews', async () => {
      repo.find.mockResolvedValue([]);
      expect(await service.getPendingReviews()).toEqual([]);
    });
  });

  // ===========================
  // detectPrivilegeCreep()
  // ===========================

  describe('detectPrivilegeCreep', () => {
    it('should return false (placeholder implementation)', async () => {
      const result = await service.detectPrivilegeCreep('user-1');
      expect(result).toBe(false);
    });
  });

  // ===========================
  // remediateExcessPermissions()
  // ===========================

  describe('remediateExcessPermissions', () => {
    it('should update status to REMEDIATED and set remediatedAt', async () => {
      const mockReview = { id: 'rev-1', status: AccessReviewStatus.PENDING };
      repo.findOneOrFail.mockResolvedValue(mockReview);
      repo.update.mockResolvedValue(undefined);

      await service.remediateExcessPermissions('rev-1');

      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'rev-1' } });
      expect(repo.update).toHaveBeenCalledWith('rev-1',
        expect.objectContaining({
          status: AccessReviewStatus.REMEDIATED,
          remediatedAt: expect.any(Date),
        }),
      );
    });

    it('should propagate error when review not found', async () => {
      repo.findOneOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.remediateExcessPermissions('nonexistent'))
        .rejects.toThrow('Not found');
    });
  });
});
