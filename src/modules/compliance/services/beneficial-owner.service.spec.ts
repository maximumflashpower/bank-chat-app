import { BeneficialOwnerService } from './beneficial-owner.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('../entities/beneficial-owner.entity');

describe('BeneficialOwnerService', () => {
  let service: BeneficialOwnerService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };
    service = new BeneficialOwnerService(mockRepo);
  });

  // ─── discoverOwnershipChain ──────────────────────────────────
  describe('discoverOwnershipChain', () => {
    it('should return owners for an entity', async () => {
      const owners = [
        { id: 'o1', entityId: 'e1', ownerName: 'Alice', ownershipPct: 60 },
        { id: 'o2', entityId: 'e1', ownerName: 'Bob', ownershipPct: 40 },
      ];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.discoverOwnershipChain('e1');

      expect(result).toEqual(owners);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { entityId: 'e1' } });
    });

    it('should return empty array when no owners found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.discoverOwnershipChain('e-none');
      expect(result).toEqual([]);
    });
  });

  // ─── identifyUbo ─────────────────────────────────────────────
  describe('identifyUbo', () => {
    it('should return owners above default 25% threshold', async () => {
      const owners = [
        { id: 'o1', ownerName: 'Alice', ownershipPct: 30 },
        { id: 'o2', ownerName: 'Bob', ownershipPct: 20 },
        { id: 'o3', ownerName: 'Charlie', ownershipPct: 50 },
      ];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.identifyUbo('e1');

      expect(result).toHaveLength(2);
      expect(result[0].ownerName).toBe('Alice');
      expect(result[1].ownerName).toBe('Charlie');
    });

    it('should return empty array when no owners meet threshold', async () => {
      const owners = [
        { id: 'o1', ownerName: 'Alice', ownershipPct: 10 },
        { id: 'o2', ownerName: 'Bob', ownershipPct: 5 },
      ];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.identifyUbo('e1');
      expect(result).toEqual([]);
    });

    it('should respect custom threshold', async () => {
      const owners = [
        { id: 'o1', ownerName: 'Alice', ownershipPct: 15 },
        { id: 'o2', ownerName: 'Bob', ownershipPct: 50 },
      ];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.identifyUbo('e1', 10);
      expect(result).toHaveLength(2);
    });

    it('should handle numeric string ownershipPct', async () => {
      const owners = [
        { id: 'o1', ownerName: 'Alice', ownershipPct: '30' },
        { id: 'o2', ownerName: 'Bob', ownershipPct: '20' },
      ];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.identifyUbo('e1');
      expect(result).toHaveLength(1);
      expect(result[0].ownerName).toBe('Alice');
    });
  });

  // ─── addBeneficialOwner ──────────────────────────────────────
  describe('addBeneficialOwner', () => {
    it('should throw BadRequestException for short owner name', async () => {
      await expect(
        service.addBeneficialOwner({ entityId: 'e1', ownerName: 'A', ownershipPct: 50, isPep: false, kycVerified: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative ownershipPct', async () => {
      await expect(
        service.addBeneficialOwner({ entityId: 'e1', ownerName: 'Alice', ownershipPct: -10, isPep: false, kycVerified: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for ownershipPct > 100', async () => {
      await expect(
        service.addBeneficialOwner({ entityId: 'e1', ownerName: 'Alice', ownershipPct: 150, isPep: false, kycVerified: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save and return new beneficial owner', async () => {
      const saved = { id: 'bo-1', entityId: 'e1', ownerName: 'Alice', ownershipPct: 50 };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.addBeneficialOwner({
        entityId: 'e1',
        ownerName: 'Alice',
        ownershipPct: 50,
        isPep: false,
        kycVerified: true,
      });

      expect(result).toEqual(saved);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should accept ownershipChain parameter', async () => {
      const saved = { id: 'bo-2' };
      mockRepo.save.mockResolvedValue(saved);

      await service.addBeneficialOwner({
        entityId: 'e1',
        ownerName: 'Alice',
        ownershipPct: 50,
        isPep: false,
        kycVerified: false,
        ownershipChain: { tier1: 'Corp A', tier2: 'Holdings B' },
      });

      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── getByEntityId ───────────────────────────────────────────
  describe('getByEntityId', () => {
    it('should return owners for an entity', async () => {
      const owners = [{ id: 'o1', entityId: 'e1' }];
      mockRepo.find.mockResolvedValue(owners);

      const result = await service.getByEntityId('e1');

      expect(result).toEqual(owners);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { entityId: 'e1' } });
    });

    it('should return empty array when no owners', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.getByEntityId('e-none');
      expect(result).toEqual([]);
    });
  });
});
