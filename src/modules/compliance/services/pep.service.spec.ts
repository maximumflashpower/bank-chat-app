import { PepService } from './pep.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('../entities/pep-record.entity');

describe('PepService', () => {
  let service: PepService;
  let mockRepo: any;

  beforeEach(() => {
    const mockQuery = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
      findOne: jest.fn(),
    };
    service = new PepService(mockRepo);
    // Keep reference for tests
    (service as any)._mockQuery = mockQuery;
  });

  // ─── searchPep ───────────────────────────────────────────────
  describe('searchPep', () => {
    it('should throw BadRequestException for short name', async () => {
      await expect(service.searchPep('A')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty name', async () => {
      await expect(service.searchPep('')).rejects.toThrow(BadRequestException);
    });

    it('should return isPep=true when matches found', async () => {
      const records = [{ id: '1', fullName: 'John Politician' }];
      (service as any)._mockQuery.getMany.mockResolvedValue(records);

      const result = await service.searchPep('John');

      expect(result.isPep).toBe(true);
      expect(result.records).toHaveLength(1);
      expect(result.matchCount).toBe(1);
    });

    it('should return isPep=false when no matches found', async () => {
      (service as any)._mockQuery.getMany.mockResolvedValue([]);

      const result = await service.searchPep('Nobody');

      expect(result.isPep).toBe(false);
      expect(result.records).toHaveLength(0);
      expect(result.matchCount).toBe(0);
    });

    it('should build query with ILIKE and active filter', async () => {
      (service as any)._mockQuery.getMany.mockResolvedValue([]);

      await service.searchPep('John');

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('pep');
      expect((service as any)._mockQuery.where).toHaveBeenCalledWith(
        'pep.full_name ILIKE :name',
        { name: '%John%' },
      );
      expect((service as any)._mockQuery.andWhere).toHaveBeenCalledWith('pep.is_active = true');
    });
  });

  // ─── screenFamilyAndAssociates ───────────────────────────────
  describe('screenFamilyAndAssociates', () => {
    it('should throw BadRequestException if PEP record not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.screenFamilyAndAssociates('missing'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return family members and close associates', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'pep-1',
        familyMembers: ['Spouse Jane', 'Son John Jr'],
        closeAssociates: ['Associate Bob'],
      });

      const result = await service.screenFamilyAndAssociates('pep-1');

      expect(result.screened).toBe(true);
      expect(result.familyMembers).toEqual(['Spouse Jane', 'Son John Jr']);
      expect(result.closeAssociates).toEqual(['Associate Bob']);
    });

    it('should return empty arrays when PEP has no family/associates', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'pep-2',
        familyMembers: null,
        closeAssociates: null,
      });

      const result = await service.screenFamilyAndAssociates('pep-2');

      expect(result.screened).toBe(true);
      expect(result.familyMembers).toEqual([]);
      expect(result.closeAssociates).toEqual([]);
    });
  });
});
