import { AdverseMediaService } from './adverse-media.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../entities/adverse-media.entity');

describe('AdverseMediaService', () => {
  let service: AdverseMediaService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    service = new AdverseMediaService(mockRepo);
  });

  // ─── scanEntity ──────────────────────────────────────────────
  describe('scanEntity', () => {
    it('should throw BadRequestException for short entity name', async () => {
      await expect(service.scanEntity('A')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty entity name', async () => {
      await expect(service.scanEntity('')).rejects.toThrow(BadRequestException);
    });

    it('should return scan results with hits and severity breakdown', async () => {
      mockRepo.save.mockResolvedValue({});

      const result = await service.scanEntity('Acme Corp');

      expect(result.scanned).toBe(true);
      expect(result.hits).toHaveLength(2);
      expect(result.relevantHits).toBe(1);
      expect(result.severityBreakdown.high).toBe(0);
      expect(result.severityBreakdown.medium).toBe(1);
      expect(result.severityBreakdown.low).toBe(1);
      expect(mockRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should save each hit to repository', async () => {
      mockRepo.save.mockResolvedValue({});

      await service.scanEntity('Test Entity');

      const savedCalls = mockRepo.save.mock.calls;
      expect(savedCalls).toHaveLength(2);
      expect(savedCalls[0][0].entityName).toBe('Test Entity');
      expect(savedCalls[1][0].entityName).toBe('Test Entity');
    });

    it('should accept optional sources parameter', async () => {
      mockRepo.save.mockResolvedValue({});

      const result = await service.scanEntity('Acme', ['news', 'social-media']);

      expect(result.scanned).toBe(true);
    });
  });

  // ─── getByEntity ─────────────────────────────────────────────
  describe('getByEntity', () => {
    it('should return adverse media results ordered by publishedDate DESC', async () => {
      const results = [
        { id: 'r1', entityName: 'Acme', publishedDate: new Date('2026-01-01') },
        { id: 'r2', entityName: 'Acme', publishedDate: new Date('2025-06-01') },
      ];
      mockRepo.find.mockResolvedValue(results);

      const result = await service.getByEntity('Acme');

      expect(result).toEqual(results);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { entityName: 'Acme' },
        order: { publishedDate: 'DESC' },
      });
    });

    it('should return empty array when no results', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.getByEntity('Nobody');
      expect(result).toEqual([]);
    });
  });

  // ─── markNotRelevant ─────────────────────────────────────────
  describe('markNotRelevant', () => {
    it('should throw NotFoundException if result not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.markNotRelevant('missing')).rejects.toThrow(NotFoundException);
    });

    it('should set isRelevant to false and save', async () => {
      const result = { id: 'r1', isRelevant: true };
      mockRepo.findOne.mockResolvedValue(result);
      mockRepo.save.mockResolvedValue(result);

      const res = await service.markNotRelevant('r1');

      expect(res.isRelevant).toBe(false);
      expect(mockRepo.save).toHaveBeenCalledWith(result);
    });
  });
});
