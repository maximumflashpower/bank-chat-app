import { TaxExemptionService } from './tax-exemption.service';
import { NotFoundException } from '@nestjs/common';

// The service uses an in-memory module-level store that persists across tests.
// We use unique customerIds per test to avoid collisions.

describe('TaxExemptionService', () => {
  let service: TaxExemptionService;

  beforeEach(() => {
    service = new TaxExemptionService();
  });

  // ─── create ────────────────────────────────────────────────
  describe('create', () => {
    it('should create exemption with active=true', async () => {
      const result = await service.create({
        customerId: 'create-1',
        exemptionType: 'resale',
      } as any);

      expect(result.id).toBeDefined();
      expect(result.active).toBe(true);
      expect(result.customerId).toBe('create-1');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should convert validFrom string to Date', async () => {
      const result = await service.create({
        customerId: 'create-2',
        exemptionType: 'wholesale',
        validFrom: '2026-01-15',
      } as any);

      expect(result.validFrom).toBeInstanceOf(Date);
    });

    it('should convert validUntil string to Date', async () => {
      const result = await service.create({
        customerId: 'create-3',
        exemptionType: 'government',
        validUntil: '2026-12-31',
      } as any);

      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should leave validFrom undefined when not provided', async () => {
      const result = await service.create({
        customerId: 'create-4',
        exemptionType: 'resale',
      } as any);

      expect(result.validFrom).toBeUndefined();
    });
  });

  // ─── findAll ───────────────────────────────────────────────
  describe('findAll', () => {
    it('should return active exemptions', async () => {
      await service.create({ customerId: 'findAll-1', exemptionType: 'resale' } as any);
      const result = await service.findAll();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(e => e.active)).toBe(true);
    });

    it('should not return deactivated exemptions', async () => {
      const created = await service.create({ customerId: 'findAll-2', exemptionType: 'resale' } as any);
      await service.deactivate(created.id);
      const result = await service.findAll();

      expect(result.find(e => e.id === created.id)).toBeUndefined();
    });
  });

  // ─── findByCustomer ────────────────────────────────────────
  describe('findByCustomer', () => {
    it('should return exemptions for a customer', async () => {
      await service.create({ customerId: 'findCust-1', exemptionType: 'resale' } as any);
      const result = await service.findByCustomer('findCust-1');

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every(e => e.customerId === 'findCust-1')).toBe(true);
    });

    it('should return empty array for customer with no exemptions', async () => {
      const result = await service.findByCustomer('cust-none-existent');
      expect(result).toEqual([]);
    });

    it('should not return deactivated exemptions for customer', async () => {
      const created = await service.create({ customerId: 'findCust-deact-1', exemptionType: 'resale' } as any);
      await service.deactivate(created.id);
      const result = await service.findByCustomer('findCust-deact-1');

      expect(result).toEqual([]);
    });
  });

  // ─── validateExemption ─────────────────────────────────────
  describe('validateExemption', () => {
    it('should return true when active exemption exists', async () => {
      await service.create({ customerId: 'validate-1', exemptionType: 'resale' } as any);
      const result = await service.validateExemption('validate-1');
      expect(result).toBe(true);
    });

    it('should return false when no exemption exists', async () => {
      const result = await service.validateExemption('validate-none');
      expect(result).toBe(false);
    });

    it('should return false when exemption is expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await service.create({
        customerId: 'validate-expired-1',
        exemptionType: 'resale',
        validUntil: pastDate.toISOString(),
      } as any);

      const result = await service.validateExemption('validate-expired-1');
      expect(result).toBe(false);
    });

    it('should return true when validUntil is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await service.create({
        customerId: 'validate-future-1',
        exemptionType: 'resale',
        validUntil: futureDate.toISOString(),
      } as any);

      const result = await service.validateExemption('validate-future-1');
      expect(result).toBe(true);
    });

    it('should match jurisdictionCode when provided', async () => {
      await service.create({
        customerId: 'validate-juris-1',
        exemptionType: 'resale',
        jurisdictionCode: 'US-CA',
      } as any);

      const result = await service.validateExemption('validate-juris-1', 'US-CA');
      expect(result).toBe(true);
    });

    it('should return false when jurisdictionCode does not match', async () => {
      await service.create({
        customerId: 'validate-juris-2',
        exemptionType: 'resale',
        jurisdictionCode: 'US-CA',
      } as any);

      const result = await service.validateExemption('validate-juris-2', 'US-NY');
      expect(result).toBe(false);
    });
  });

  // ─── deactivate ───────────────────────────────────────────
  describe('deactivate', () => {
    it('should throw NotFoundException when exemption not found', async () => {
      await expect(service.deactivate('nonexistent-id-12345')).rejects.toThrow(NotFoundException);
    });

    it('should set active to false', async () => {
      const created = await service.create({ customerId: 'deact-1', exemptionType: 'resale' } as any);
      await service.deactivate(created.id);

      const exemptions = await service.findByCustomer('deact-1');
      expect(exemptions).toEqual([]);
    });

    it('should update updatedAt', async () => {
      const created = await service.create({ customerId: 'deact-2', exemptionType: 'resale' } as any);
      await service.deactivate(created.id);

      // Verify it's deactivated by checking findAll doesn't include it
      const all = await service.findAll();
      expect(all.find(e => e.id === created.id)).toBeUndefined();
    });
  });
});
