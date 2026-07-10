import { OcrExtractionService } from './ocr-extraction.service';

jest.mock('../entities/ai-ocr-extraction-task.entity');

describe('OcrExtractionService', () => {
  let service: OcrExtractionService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    service = new OcrExtractionService(mockRepo);
  });

  describe('processDocument', () => {
    it('should create task with processing status and generated documentId', async () => {
      const created = { id: 'task-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.processDocument({ fileName: 'invoice.pdf', mimeType: 'application/pdf' } as any);

      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.documentId).toBeDefined();
      expect(arg.extractionStatus).toBe('processing');
      expect(arg.fileName).toBe('invoice.pdf');
    });

    it('should spread dto properties into created entity', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      await service.processDocument({ fileName: 'receipt.jpg', mimeType: 'image/jpeg', fileSizeBytes: 1024 } as any);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.mimeType).toBe('image/jpeg');
      expect(arg.fileSizeBytes).toBe(1024);
    });
  });

  describe('findById', () => {
    it('should return task when found', async () => {
      const task = { id: 'task-1' };
      mockRepo.findOne.mockResolvedValue(task);
      expect(await service.findById('task-1')).toEqual(task);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('markCompleted', () => {
    it('should set extractionStatus, extractedDataJson, confidenceScore, and processingTimeMs', async () => {
      const before = Date.now();
      await service.markCompleted('task-1', { vendor: 'Acme', total: 500 }, 0.95);
      const arg = mockRepo.update.mock.calls[0][1];
      expect(arg.extractionStatus).toBe('completed');
      expect(arg.extractedDataJson).toEqual({ vendor: 'Acme', total: 500 });
      expect(arg.confidenceScore).toBe(0.95);
      expect(arg.processingTimeMs).toBeGreaterThanOrEqual(before);
    });
  });

  describe('markNeedsReview', () => {
    it('should set extractionStatus to needs_review', async () => {
      await service.markNeedsReview('task-1');
      expect(mockRepo.update).toHaveBeenCalledWith('task-1', { extractionStatus: 'needs_review' });
    });
  });
});
