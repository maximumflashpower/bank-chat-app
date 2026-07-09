jest.mock('../entities/consent.entity');

import { ConsentService } from './consent.service';
import { ConsentPurpose } from '../entities/consent-purpose.enum';
import { ConsentLegalBasis } from '../entities/consent-legal-basis.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ConsentService', () => {
  let service: ConsentService;
  let consentRepo: any;

  beforeEach(() => {
    consentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new ConsentService(consentRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listUserConsents', () => {
    it('should return consents ordered by createdAt DESC', async () => {
      const mockConsents = [{ id: 'c1' }, { id: 'c2' }];
      consentRepo.find.mockResolvedValue(mockConsents);
      const result = await service.listUserConsents('user-1');
      expect(result).toBe(mockConsents);
      expect(consentRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no consents', async () => {
      consentRepo.find.mockResolvedValue([]);
      expect(await service.listUserConsents('user-1')).toEqual([]);
    });
  });

  describe('getOrCreateConsent', () => {
    it('should return existing consent', async () => {
      const mockConsent = { id: 'c1', userId: 'u1', purpose: ConsentPurpose.MARKETING };
      consentRepo.findOne.mockResolvedValue(mockConsent);
      const result = await service.getOrCreateConsent('u1', ConsentPurpose.MARKETING);
      expect(result).toBe(mockConsent);
      expect(consentRepo.create).not.toHaveBeenCalled();
    });

    it('should create and save new consent when not found', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'c1', userId: 'u1', purpose: ConsentPurpose.ANALYTICS, granted: false };
      consentRepo.create.mockReturnValue(mockCreated);
      consentRepo.save.mockResolvedValue(mockCreated);
      const result = await service.getOrCreateConsent('u1', ConsentPurpose.ANALYTICS);
      expect(consentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          purpose: ConsentPurpose.ANALYTICS,
          legalBasis: ConsentLegalBasis.CONSENT,
          granted: false,
        }),
      );
      expect(result).toBe(mockCreated);
    });
  });

  describe('grantConsent', () => {
    const dto = {
      purpose: ConsentPurpose.MARKETING,
      legalBasis: ConsentLegalBasis.CONSENT,
      version: '1.0',
      granularity: { email: true },
    };

    it('should create new consent when none exists', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'c1', ...dto, granted: true };
      consentRepo.create.mockImplementation((d: any) => ({ id: 'c-new', ...d, granted: false }));
      consentRepo.save.mockResolvedValue(mockCreated);
      const result = await service.grantConsent('u1', dto, '127.0.0.1', 'Mozilla');
      expect(result).toBe(mockCreated);
      expect(consentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          purpose: dto.purpose,
          granted: true,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla',
        }),
      );
    });

    it('should throw ConflictException when consent already granted', async () => {
      consentRepo.findOne.mockResolvedValue({ id: 'c1', granted: true });
      await expect(service.grantConsent('u1', dto)).rejects.toThrow(ConflictException);
    });

    it('should update existing non-granted consent', async () => {
      const existing = { id: 'c1', granted: false, legalBasis: null, version: null };
      consentRepo.findOne.mockResolvedValue(existing);
      consentRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.grantConsent('u1', dto, '10.0.0.1', 'Chrome');
      expect(result.granted).toBe(true);
      expect(result.grantedAt).toBeDefined();
      expect(result.revokedAt).toBeNull();
      expect(result.legalBasis).toBe(dto.legalBasis);
      expect(result.version).toBe('1.0');
      expect(result.ipAddress).toBe('10.0.0.1');
    });

    it('should default granularity and version to null when not provided', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      const mockCreated = { id: 'c1' };
      consentRepo.create.mockImplementation((d: any) => ({ id: 'c-new', ...d, granted: false }));
      consentRepo.save.mockResolvedValue(mockCreated);
      await service.grantConsent('u1', { purpose: ConsentPurpose.ANALYTICS, legalBasis: ConsentLegalBasis.CONSENT });
      expect(consentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          granularity: null,
          version: null,
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });

  describe('revokeConsent', () => {
    it('should revoke a granted consent', async () => {
      const mc = { id: 'c1', userId: 'u1', granted: true, legalBasis: ConsentLegalBasis.CONSENT, purpose: ConsentPurpose.MARKETING };
      consentRepo.findOne.mockResolvedValue(mc);
      consentRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.revokeConsent('c1', 'u1');
      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw NotFoundException when consent not found', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      await expect(service.revokeConsent('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already revoked', async () => {
      consentRepo.findOne.mockResolvedValue({ id: 'c1', granted: false, legalBasis: ConsentLegalBasis.CONSENT });
      await expect(service.revokeConsent('c1', 'u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('getPreferences', () => {
    it('should return existing consents and create missing ones', async () => {
      const existing = [
        { id: 'c1', purpose: ConsentPurpose.MARKETING, granted: true },
        { id: 'c2', purpose: ConsentPurpose.ESSENTIAL, granted: true },
      ];
      consentRepo.find.mockResolvedValue(existing);
      const mockCreated = { id: 'c3', purpose: ConsentPurpose.ANALYTICS, granted: false };
      consentRepo.findOne.mockResolvedValue(null);
      consentRepo.create.mockImplementation((d: any) => ({ id: 'c-new', ...d, granted: false }));
      consentRepo.save.mockResolvedValue(mockCreated);
      const result = await service.getPreferences('u1');
      expect(result.consents).toHaveLength(4);
      expect(result.summary).toHaveProperty('marketing', true);
      expect(result.summary).toHaveProperty('essential', true);
      expect(result.summary).toHaveProperty('analytics', false);
      expect(result.summary).toHaveProperty('third_party', false);
    });

    it('should return all consents when all purposes exist', async () => {
      const all = [
        { id: 'c1', purpose: ConsentPurpose.MARKETING, granted: true },
        { id: 'c2', purpose: ConsentPurpose.ANALYTICS, granted: false },
        { id: 'c3', purpose: ConsentPurpose.THIRD_PARTY, granted: true },
        { id: 'c4', purpose: ConsentPurpose.ESSENTIAL, granted: true },
      ];
      consentRepo.find.mockResolvedValue(all);
      const result = await service.getPreferences('u1');
      expect(result.consents).toHaveLength(4);
      expect(Object.keys(result.summary)).toHaveLength(4);
    });
  });

  describe('updatePreferences', () => {
    it('should revoke all non-essential when revokeAllNonEssential is true', async () => {
      const mk = { id: 'c1', purpose: ConsentPurpose.MARKETING, granted: true, legalBasis: ConsentLegalBasis.CONSENT };
      const an = { id: 'c2', purpose: ConsentPurpose.ANALYTICS, granted: true, legalBasis: ConsentLegalBasis.CONSENT };
      const tp = { id: 'c3', purpose: ConsentPurpose.THIRD_PARTY, granted: false, legalBasis: ConsentLegalBasis.CONSENT };
      consentRepo.findOne.mockImplementation((opts: any) => {
        const p = opts.where?.purpose;
        const id = opts.where?.id;
        if (id === 'c1' || p === ConsentPurpose.MARKETING) return mk;
        if (id === 'c2' || p === ConsentPurpose.ANALYTICS) return an;
        if (id === 'c3' || p === ConsentPurpose.THIRD_PARTY) return tp;
        return null;
      });
      consentRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      const result = await service.updatePreferences('u1', { revokeAllNonEssential: true });
      expect(mk.granted).toBe(false);
      expect(mk.revokedAt).toBeDefined();
      expect(an.granted).toBe(false);
      expect(tp.granted).toBe(false);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should skip essential when revoking all non-essential', async () => {
      const ec = { id: 'c1', purpose: ConsentPurpose.ESSENTIAL, granted: true, legalBasis: ConsentLegalBasis.LEGAL_OBLIGATION };
      consentRepo.findOne.mockImplementation((opts: any) => {
        const p = opts.where?.purpose;
        const id = opts.where?.id;
        if (id === 'c1' || p === ConsentPurpose.ESSENTIAL) return ec;
        return null;
      });
      await service.updatePreferences('u1', { revokeAllNonEssential: true });
      expect(ec.granted).toBe(true);
    });

    it('should grant specified purposes and revoke others', async () => {
      const mk = { id: 'c1', userId: 'u1', purpose: ConsentPurpose.MARKETING, granted: false, legalBasis: ConsentLegalBasis.CONSENT };
      const an = { id: 'c2', userId: 'u1', purpose: ConsentPurpose.ANALYTICS, granted: true, legalBasis: ConsentLegalBasis.CONSENT };
      consentRepo.findOne.mockImplementation((opts: any) => {
        const p = opts.where?.purpose;
        const id = opts.where?.id;
        if (id === 'c1' || p === ConsentPurpose.MARKETING) return mk;
        if (id === 'c2' || p === ConsentPurpose.ANALYTICS) return an;
        return null;
      });
      consentRepo.create.mockImplementation((d: any) => ({ ...mk, ...d }));
      consentRepo.save.mockImplementation((e: any) => Promise.resolve(e));
      await service.updatePreferences('u1', { purposes: [ConsentPurpose.MARKETING] });
      expect(mk.granted).toBe(true);
      expect(an.granted).toBe(false);
      expect(an.revokedAt).toBeDefined();
    });
  });

  describe('hasConsent', () => {
    it('should return true when consent is granted', async () => {
      consentRepo.findOne.mockResolvedValue({ granted: true });
      expect(await service.hasConsent('u1', ConsentPurpose.MARKETING)).toBe(true);
    });

    it('should return false when consent is not granted', async () => {
      consentRepo.findOne.mockResolvedValue({ granted: false });
      expect(await service.hasConsent('u1', ConsentPurpose.MARKETING)).toBe(false);
    });

    it('should return false when no consent record exists', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      expect(await service.hasConsent('u1', ConsentPurpose.MARKETING)).toBe(false);
    });
  });

  describe('invalidateForNewPolicyVersion', () => {
    it('should update consents and return affected count', async () => {
      const mockQB = { getQuery: jest.fn().mockReturnValue('SELECT * FROM ...') };
      consentRepo.createQueryBuilder.mockReturnValue(mockQB);
      consentRepo.update.mockResolvedValue({ affected: 5, raw: {}, generatedMaps: [] });
      const result = await service.invalidateForNewPolicyVersion('2.0');
      expect(result).toBe(5);
      expect(consentRepo.update).toHaveBeenCalled();
    });

    it('should return 0 when no consents affected', async () => {
      const mockQB = { getQuery: jest.fn().mockReturnValue('SELECT') };
      consentRepo.createQueryBuilder.mockReturnValue(mockQB);
      consentRepo.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      expect(await service.invalidateForNewPolicyVersion('2.0')).toBe(0);
    });

    it('should handle null affected result', async () => {
      const mockQB = { getQuery: jest.fn().mockReturnValue('SELECT') };
      consentRepo.createQueryBuilder.mockReturnValue(mockQB);
      consentRepo.update.mockResolvedValue({ affected: null, raw: {}, generatedMaps: [] });
      expect(await service.invalidateForNewPolicyVersion('2.0')).toBe(0);
    });
  });
});
