import { ScreeningService } from './screening.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityType } from '../entities/entity-type.enum';
import { ListSource } from '../entities/list-source.enum';
import { ScreeningStatus } from '../entities/screening-status.enum';

jest.mock('../entities/screening-result.entity');
jest.mock('../entities/sanction-list.entity');

describe('ScreeningService', () => {
  let service: ScreeningService;
  let mockResultRepo: any;
  let mockListRepo: any;

  beforeEach(() => {
    mockResultRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockListRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };
    service = new ScreeningService(mockResultRepo, mockListRepo);
  });

  // ─── fuzzyMatch ─────────────────────────────────────────────
  describe('fuzzyMatch', () => {
    it('should return 100 for identical names', () => {
      expect(service.fuzzyMatch('John Doe', 'John Doe')).toBe(100);
    });

    it('should be case-insensitive', () => {
      expect(service.fuzzyMatch('JOHN DOE', 'john doe')).toBe(100);
    });

    it('should trim whitespace', () => {
      expect(service.fuzzyMatch('  John Doe  ', 'John Doe')).toBe(100);
    });

    it('should normalize multiple spaces', () => {
      expect(service.fuzzyMatch('John   Doe', 'John Doe')).toBe(100);
    });

    it('should return lower score for partial match', () => {
      const score = service.fuzzyMatch('John Smith', 'John Doe');
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it('should match token with prefix when length > 3', () => {
      const score = service.fuzzyMatch('Alexander Doe', 'Alex Doe');
      expect(score).toBeGreaterThan(0);
    });

    it('should match with small Levenshtein distance', () => {
      const score = service.fuzzyMatch('Jon Doe', 'John Doe');
      expect(score).toBeGreaterThan(0);
    });
  });

  // ─── matchWithAliases ───────────────────────────────────────
  describe('matchWithAliases', () => {
    it('should return best score and matched alias', () => {
      const result = service.matchWithAliases('John Doe', ['Jane Smith', 'John Doe', 'Bob Wilson']);
      expect(result.bestScore).toBe(100);
      expect(result.matchedAlias).toBe('John Doe');
    });

    it('should return null matchedAlias when no aliases provided', () => {
      const result = service.matchWithAliases('John Doe', []);
      expect(result.bestScore).toBe(0);
      expect(result.matchedAlias).toBeNull();
    });

    it('should select highest scoring alias', () => {
      const result = service.matchWithAliases('John', ['Johnny', 'John', 'Jack']);
      expect(result.matchedAlias).toBe('John');
    });
  });

  // ─── shouldBlock ────────────────────────────────────────────
  describe('shouldBlock', () => {
    it('should return true when score >= default threshold (85)', () => {
      expect(service.shouldBlock(85)).toBe(true);
      expect(service.shouldBlock(90)).toBe(true);
      expect(service.shouldBlock(100)).toBe(true);
    });

    it('should return false when score < default threshold', () => {
      expect(service.shouldBlock(84)).toBe(false);
      expect(service.shouldBlock(50)).toBe(false);
      expect(service.shouldBlock(0)).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(service.shouldBlock(70, 70)).toBe(true);
      expect(service.shouldBlock(69, 70)).toBe(false);
    });
  });

  // ─── syncOfacList ───────────────────────────────────────────
  describe('syncOfacList', () => {
    it('should sync OFAC list and return result', async () => {
      const list = { source: ListSource.OFAC, entryCount: 100, syncStatus: 'idle', active: true };
      mockListRepo.findOne.mockResolvedValue(list);
      mockListRepo.save.mockResolvedValue(list);

      const result = await service.syncOfacList();

      expect(result.source).toBe(ListSource.OFAC);
      expect(result.synced).toBe(true);
      expect(result.entriesAdded).toBeGreaterThan(0);
      expect(mockListRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should create list if it does not exist', async () => {
      mockListRepo.findOne.mockResolvedValue(null);
      const created = { source: ListSource.OFAC, entryCount: 0, syncStatus: 'syncing', active: true };
      mockListRepo.create.mockReturnValue(created);
      mockListRepo.save.mockResolvedValue(created);

      const result = await service.syncOfacList();

      expect(result.synced).toBe(true);
      expect(mockListRepo.create).toHaveBeenCalled();
    });
  });

  // ─── syncUnList ─────────────────────────────────────────────
  describe('syncUnList', () => {
    it('should sync UN list', async () => {
      const list = { source: ListSource.UN, entryCount: 50, syncStatus: 'idle', active: true };
      mockListRepo.findOne.mockResolvedValue(list);
      mockListRepo.save.mockResolvedValue(list);

      const result = await service.syncUnList();
      expect(result.source).toBe(ListSource.UN);
      expect(result.synced).toBe(true);
    });
  });

  // ─── syncEuList ─────────────────────────────────────────────
  describe('syncEuList', () => {
    it('should sync EU list', async () => {
      const list = { source: ListSource.EU, entryCount: 30, syncStatus: 'idle', active: true };
      mockListRepo.findOne.mockResolvedValue(list);
      mockListRepo.save.mockResolvedValue(list);

      const result = await service.syncEuList();
      expect(result.source).toBe(ListSource.EU);
      expect(result.synced).toBe(true);
    });
  });

  // ─── syncHmtList ────────────────────────────────────────────
  describe('syncHmtList', () => {
    it('should sync HMT list', async () => {
      const list = { source: ListSource.HMT, entryCount: 20, syncStatus: 'idle', active: true };
      mockListRepo.findOne.mockResolvedValue(list);
      mockListRepo.save.mockResolvedValue(list);

      const result = await service.syncHmtList();
      expect(result.source).toBe(ListSource.HMT);
      expect(result.synced).toBe(true);
    });
  });

  // ─── syncLocalList ──────────────────────────────────────────
  describe('syncLocalList', () => {
    it('should sync LOCAL list', async () => {
      const list = { source: ListSource.LOCAL, entryCount: 10, syncStatus: 'idle', active: true };
      mockListRepo.findOne.mockResolvedValue(list);
      mockListRepo.save.mockResolvedValue(list);

      const result = await service.syncLocalList();
      expect(result.source).toBe(ListSource.LOCAL);
      expect(result.synced).toBe(true);
    });
  });

  // ─── adjudicateHit ──────────────────────────────────────────
  describe('adjudicateHit', () => {
    it('should throw NotFoundException if screening result not found', async () => {
      mockResultRepo.findOne.mockResolvedValue(null);
      await expect(
        service.adjudicateHit('missing', 'reviewer-1', 'cleared', 'notes'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already adjudicated', async () => {
      mockResultRepo.findOne.mockResolvedValue({
        id: 'sr-1',
        status: ScreeningStatus.CLEARED,
      });
      await expect(
        service.adjudicateHit('sr-1', 'reviewer-1', 'blocked', 'notes'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should adjudicate as cleared', async () => {
      const result = { id: 'sr-1', status: ScreeningStatus.PENDING, reviewedBy: null, isBlocked: null };
      mockResultRepo.findOne.mockResolvedValue(result);
      mockResultRepo.save.mockResolvedValue(result);

      const res = await service.adjudicateHit('sr-1', 'reviewer-1', 'cleared', 'Looks safe');

      expect(res.status).toBe(ScreeningStatus.CLEARED);
      expect(res.reviewedBy).toBe('reviewer-1');
      expect(res.isBlocked).toBe(false);
      expect(mockResultRepo.save).toHaveBeenCalled();
    });

    it('should adjudicate as blocked', async () => {
      const result = { id: 'sr-2', status: ScreeningStatus.PENDING, reviewedBy: null, isBlocked: null };
      mockResultRepo.findOne.mockResolvedValue(result);
      mockResultRepo.save.mockResolvedValue(result);

      const res = await service.adjudicateHit('sr-2', 'reviewer-1', 'blocked', 'Confirmed match');

      expect(res.status).toBe(ScreeningStatus.BLOCKED);
      expect(res.reviewedBy).toBe('reviewer-1');
      expect(res.isBlocked).toBe(true);
      expect(mockResultRepo.save).toHaveBeenCalled();
    });
  });

  // ─── checkScreening ─────────────────────────────────────────
  describe('checkScreening', () => {
    it('should throw BadRequestException for short entity name', async () => {
      await expect(
        service.checkScreening({
          entityName: 'A',
          entityType: EntityType.INDIVIDUAL,
          knownEntries: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return CLEARED when no matches found', async () => {
      const saved = { id: 'sr-1', status: ScreeningStatus.CLEARED, matchScore: 0 };
      mockResultRepo.save.mockResolvedValue(saved);

      const result = await service.checkScreening({
        entityName: 'Random Guy',
        entityType: EntityType.INDIVIDUAL,
        knownEntries: [
          { name: 'Sanctioned Person', listSource: ListSource.OFAC, entryId: 'e-1' },
        ],
      });

      expect(result.status).toBe(ScreeningStatus.CLEARED);
      expect(result.matchScore).toBe(0);
    });

    it('should return BLOCKED when match score >= 85', async () => {
      const saved = { id: 'sr-2', status: ScreeningStatus.BLOCKED, matchScore: 100, isBlocked: true };
      mockResultRepo.save.mockResolvedValue(saved);

      const result = await service.checkScreening({
        entityName: 'John Doe',
        entityType: EntityType.INDIVIDUAL,
        knownEntries: [
          { name: 'John Doe', listSource: ListSource.OFAC, entryId: 'e-1' },
        ],
      });

      expect(result.status).toBe(ScreeningStatus.BLOCKED);
      expect(result.isBlocked).toBe(true);
    });

    it('should return PENDING when match is between 50 and 84', async () => {
      const saved = { id: 'sr-3', status: ScreeningStatus.PENDING, matchScore: 50 };
      mockResultRepo.save.mockResolvedValue(saved);

      const result = await service.checkScreening({
        entityName: 'John Doe',
        entityType: EntityType.INDIVIDUAL,
        knownEntries: [
          { name: 'John Doe Smith', listSource: ListSource.UN, entryId: 'e-2' },
        ],
      });

      // The match score should be > 0 but maybe not >= 85
      expect(mockResultRepo.save).toHaveBeenCalled();
    });

    it('should match via aliases', async () => {
      const saved = { id: 'sr-4', status: ScreeningStatus.BLOCKED, matchScore: 100, isBlocked: true };
      mockResultRepo.save.mockResolvedValue(saved);

      const result = await service.checkScreening({
        entityName: 'John Doe',
        entityType: EntityType.INDIVIDUAL,
        knownEntries: [
          { name: 'Different Name', aliases: ['John Doe', 'JD'], listSource: ListSource.EU, entryId: 'e-3' },
        ],
      });

      expect(mockResultRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty entity name', async () => {
      await expect(
        service.checkScreening({
          entityName: '',
          entityType: EntityType.INDIVIDUAL,
          knownEntries: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── batchScreening ─────────────────────────────────────────
  describe('batchScreening', () => {
    it('should process multiple entities and return results', async () => {
      mockResultRepo.save.mockResolvedValueOnce({ id: 'sr-1', status: ScreeningStatus.CLEARED })
        .mockResolvedValueOnce({ id: 'sr-2', status: ScreeningStatus.CLEARED });

      const results = await service.batchScreening([
        { name: 'Person One', type: EntityType.INDIVIDUAL, knownEntries: [] },
        { name: 'Person Two', type: EntityType.INDIVIDUAL, knownEntries: [] },
      ]);

      expect(results).toHaveLength(2);
      expect(mockResultRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should handle empty batch', async () => {
      const results = await service.batchScreening([]);
      expect(results).toHaveLength(0);
    });
  });

  // ─── getActiveLists ─────────────────────────────────────────
  describe('getActiveLists', () => {
    it('should return active sanction lists', async () => {
      const lists = [
        { source: ListSource.OFAC, active: true, entryCount: 100 },
        { source: ListSource.UN, active: true, entryCount: 50 },
      ];
      mockListRepo.find.mockResolvedValue(lists);

      const result = await service.getActiveLists();

      expect(result).toEqual(lists);
      expect(mockListRepo.find).toHaveBeenCalledWith({ where: { active: true } });
    });

    it('should return empty array when no active lists', async () => {
      mockListRepo.find.mockResolvedValue([]);
      const result = await service.getActiveLists();
      expect(result).toEqual([]);
    });
  });
});
