import { SmbSetupService } from './smb-setup.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/smb-company-profile.entity');
jest.mock('../entities/smb-contact-party.entity');

describe('SmbSetupService', () => {
  let service: SmbSetupService;
  let mockProfileRepo: any;
  let mockContactRepo: any;

  beforeEach(() => {
    mockProfileRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() };
    mockContactRepo = { create: jest.fn(), save: jest.fn() };
    service = new SmbSetupService(mockProfileRepo, mockContactRepo);
  });

  describe('startWizard', () => {
    it('should return existing profile when found', async () => {
      const existing = { id: 'prof-1', userId: 'user-1' };
      mockProfileRepo.findOne.mockResolvedValue(existing);

      const result = await service.startWizard('user-1');

      expect(result).toEqual(existing);
      expect(mockProfileRepo.create).not.toHaveBeenCalled();
    });

    it('should create new profile with defaults when none exists', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);
      const created = { id: 'prof-1' };
      mockProfileRepo.create.mockReturnValue(created);
      mockProfileRepo.save.mockResolvedValue(created);

      const result = await service.startWizard('user-1');

      expect(result).toEqual(created);
      const arg = mockProfileRepo.create.mock.calls[0][0];
      expect(arg.userId).toBe('user-1');
      expect(arg.businessStructureType).toBe('SoleProp');
      expect(arg.addressCountryCode).toBe('US');
      expect(arg.baseCurrency).toBe('USD');
      expect(arg.bankingTierPlan).toBe('FREE');
    });
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      const profile = { id: 'prof-1', userId: 'user-1' };
      mockProfileRepo.findOne.mockResolvedValue(profile);
      expect(await service.getProfile('user-1')).toEqual(profile);
    });

    it('should throw NotFoundException when not found', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should merge dto and save', async () => {
      const profile = { id: 'prof-1', legalBusinessName: 'Old' };
      mockProfileRepo.findOne.mockResolvedValue(profile);
      mockProfileRepo.save.mockResolvedValue(profile);

      const result = await service.updateProfile('user-1', { legalBusinessName: 'New LLC' } as any);

      expect(result.legalBusinessName).toBe('New LLC');
      expect(mockProfileRepo.save).toHaveBeenCalledWith(profile);
    });
  });

  describe('completeOnboarding', () => {
    it('should set onboardCompletedAt', async () => {
      await service.completeOnboarding('user-1');
      expect(mockProfileRepo.update).toHaveBeenCalledWith({ userId: 'user-1' }, expect.objectContaining({
        onboardCompletedAt: expect.any(Date),
      }));
    });
  });

  describe('importContacts', () => {
    it('should import valid contacts and skip invalid ones', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'prof-1', baseCurrency: 'USD' });
      mockContactRepo.create.mockImplementation(data => data);
      mockContactRepo.save.mockResolvedValue({ id: 'c-1' });

      const result = await service.importContacts('user-1', {
        contacts: [
          { companyLegalName: 'Acme', partyType: 'customer' },
          { companyLegalName: '', partyType: '' },
          { companyLegalName: 'Beta', partyType: 'supplier' },
        ],
      } as any);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
    });

    it('should apply defaults for paymentTermsDaysDefault and currencyPreference', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'prof-1', baseCurrency: 'MXN' });
      mockContactRepo.create.mockImplementation(d => d);
      mockContactRepo.save.mockResolvedValue({});

      await service.importContacts('user-1', {
        contacts: [{ companyLegalName: 'Acme', partyType: 'customer' }],
      } as any);

      const arg = mockContactRepo.create.mock.calls[0][0];
      expect(arg.paymentTermsDaysDefault).toBe(30);
      expect(arg.currencyPreference).toBe('MXN');
      expect(arg.isActive).toBe(true);
    });

    it('should use provided paymentTermsDaysDefault over default', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'prof-1', baseCurrency: 'USD' });
      mockContactRepo.create.mockImplementation(d => d);
      mockContactRepo.save.mockResolvedValue({});

      await service.importContacts('user-1', {
        contacts: [{ companyLegalName: 'Acme', partyType: 'customer', paymentTermsDaysDefault: 60 }],
      } as any);

      expect(mockContactRepo.create.mock.calls[0][0].paymentTermsDaysDefault).toBe(60);
    });
  });

  describe('generateChartOfAccounts', () => {
    it('should return retail template for NAICS 44/45', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'prof-1', industryCodeNaics: '445120' });
      const result = await service.generateChartOfAccounts('prof-1');
      expect(result.template).toBe('retail');
      expect(result.generated).toBeGreaterThan(0);
    });

    it('should return service template for other NAICS codes', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'prof-1', industryCodeNaics: '541512' });
      const result = await service.generateChartOfAccounts('prof-1');
      expect(result.template).toBe('service');
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);
      await expect(service.generateChartOfAccounts('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('configureTax', () => {
    it('should return configured=true with taxRate and jurisdiction', async () => {
      const result = await service.configureTax('user-1', 16, 'MX-CDMX');
      expect(result.configured).toBe(true);
      expect(result.taxRate).toBe(16);
      expect(result.jurisdiction).toBe('MX-CDMX');
    });
  });
});
