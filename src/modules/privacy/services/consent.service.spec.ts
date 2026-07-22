import { ConsentService } from './consent.service';
import { ConsentPurpose, LegalBasis } from '../entities/privacy-consent.entity';
import { NotFoundException } from '@nestjs/common';

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

  describe('grantConsent', () => {
    const dto = {
      purpose: ConsentPurpose.MARKETING,
      legalBasis: LegalBasis.CONSENT,
      version: '1.0',
    };

    it('should create new consent when none exists', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      consentRepo.save.mockImplementation((input: any) => Promise.resolve({ id: 'c1', ...input, granted: true, grantedAt: new Date() }));
      const result = await service.grantConsent('u1', dto, '127.0.0.1', 'Mozilla');
      expect(result.granted).toBe(true);
      expect(result.ipAddress).toBe('127.0.0.1');
    });

    it('should throw error when consent already granted', async () => {
      consentRepo.findOne.mockResolvedValue({ id: 'c1', granted: true });
      await expect(service.grantConsent('u1', dto)).rejects.toThrow(/ya otorgado/);
    });
  });

  describe('revokeConsent', () => {
    it('should revoke a granted consent', async () => {
      const mc = { id: 'c1', userId: 'u1', granted: true, legalBasis: LegalBasis.CONSENT, purpose: ConsentPurpose.MARKETING };
      consentRepo.findOne.mockResolvedValue(mc);
      consentRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.revokeConsent('c1', 'u1');
      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw NotFoundException when consent not found', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      await expect(service.revokeConsent('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasConsent', () => {
    it('should return true when consent is granted', async () => {
      consentRepo.findOne.mockResolvedValue({ id: 'c1', userId: 'u1', purpose: ConsentPurpose.MARKETING, granted: true });
      expect(await service.hasConsent('u1', ConsentPurpose.MARKETING)).toBe(true);
    });

    it('should return false when consent is not granted', async () => {
      // El servicio busca where: { userId, purpose, granted: true }
      // Si el único consentimiento tiene granted: false, findOne retorna null
      consentRepo.findOne.mockResolvedValue(null);
      const result = await service.hasConsent('u1', ConsentPurpose.MARKETING);
      expect(result).toBe(false);
    });

    it('should return false when no consent record exists', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      expect(await service.hasConsent('u1', ConsentPurpose.MARKETING)).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should update marketing consent when enabled', async () => {
      const mockConsent = { id: 'c1', userId: 'u1', purpose: ConsentPurpose.MARKETING, granted: false };
      consentRepo.findOne.mockResolvedValue(mockConsent);
      consentRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.updatePreferences('u1', { marketingEnabled: true });
      expect(result).toHaveLength(1);
    });

    it('should revoke consent when disabled', async () => {
      const mockConsent = { id: 'c1', userId: 'u1', purpose: ConsentPurpose.MARKETING, granted: true };
      consentRepo.findOne.mockResolvedValue(mockConsent);
      consentRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.updatePreferences('u1', { marketingEnabled: false });
      expect(result[0].granted).toBe(false);
    });
  });

  describe('revokeAll', () => {
    it('should revoke all granted consents for a user', async () => {
      const consents = [
        { id: 'c1', granted: true, revokedAt: null },
        { id: 'c2', granted: true, revokedAt: null },
      ];
      consentRepo.find.mockResolvedValue(consents);
      consentRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const result = await service.revokeAll('u1');
      expect(result).toBe(2);
    });
  });
});
