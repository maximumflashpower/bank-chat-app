import { JournalSuggestionService } from './journal-suggestion.service';

jest.mock('../entities/ai-journal-suggestion.entity');

describe('JournalSuggestionService', () => {
  let service: JournalSuggestionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn(), update: jest.fn() };
    service = new JournalSuggestionService(mockRepo);
  });

  describe('createSuggestion', () => {
    it('should create with pending_approval status', async () => {
      const created = { id: 'sug-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);
      const result = await service.createSuggestion('doc-1', { debit: 100, credit: 100 }, 0.85);
      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.sourceDocumentId).toBe('doc-1');
      expect(arg.suggestedEntryJson).toEqual({ debit: 100, credit: 100 });
      expect(arg.mlConfidenceScore).toBe(0.85);
      expect(arg.status).toBe('pending_approval');
    });
  });

  describe('findById', () => {
    it('should return suggestion when found', async () => {
      const sug = { id: 'sug-1' };
      mockRepo.findOne.mockResolvedValue(sug);
      expect(await service.findById('sug-1')).toEqual(sug);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('listPending', () => {
    it('should filter by pending_approval status', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.listPending();
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { status: 'pending_approval' } });
    });
  });

  describe('approve', () => {
    it('should set status to approved and approvedAt', async () => {
      await service.approve('sug-1', { approvedBy: 'user-1' } as any);
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.status).toBe('approved');
      expect(arg.approvedAt).toBeInstanceOf(Date);
      expect(arg.approvedBy).toBe('user-1');
    });
  });

  describe('reject', () => {
    it('should set status to rejected', async () => {
      await service.reject('sug-1', { rejectionReason: 'invalid' } as any);
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.status).toBe('rejected');
      expect(arg.rejectionReason).toBe('invalid');
    });
  });

  describe('listBySource', () => {
    it('should filter by sourceDocumentId', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.listBySource('doc-1');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { sourceDocumentId: 'doc-1' } });
    });
  });
});
