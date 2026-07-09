import { TaxWithholdingService } from './tax-withholding.service';

jest.mock('../entities/tax-withholding-certificate.entity');

describe('TaxWithholdingService', () => {
  let service: TaxWithholdingService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
    service = new TaxWithholdingService(mockRepo);
  });

  // ─── calculateAndIssue ──────────────────────────────────────
  describe('calculateAndIssue', () => {
    it('should calculate withholding with explicit rate', async () => {
      const created = { id: 'wh-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.calculateAndIssue({
        grossAmount: 1000,
        withholdingRate: 0.15,
        withholdingType: 'services',
        withholdeeId: 'w-1',
      } as any);

      expect(result).toEqual(created);
      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.15);
      expect(createArg.withholdingAmount).toBe(150);
      expect(createArg.netAmount).toBe(850);
    });

    it('should use default rate for services (0.10)', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 1000,
        withholdingType: 'services',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.10);
      expect(createArg.withholdingAmount).toBe(100);
    });

    it('should use default rate for payroll (0.20)', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 5000,
        withholdingType: 'payroll',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.20);
      expect(createArg.withholdingAmount).toBe(1000);
    });

    it('should use default rate for rentals (0.15)', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 2000,
        withholdingType: 'rentals',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.15);
    });

    it('should use default rate for dividends (0.30)', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 10000,
        withholdingType: 'dividends',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.30);
      expect(createArg.withholdingAmount).toBe(3000);
    });

    it('should use 0.10 fallback for unknown type', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 1000,
        withholdingType: 'unknown_type',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.withholdingRate).toBe(0.10);
    });

    it('should generate certificate number with WH prefix', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 1000,
        withholdingType: 'services',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.certificateNumber).toMatch(/^WH-\d+/);
    });

    it('should set certifiedAt to current date', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      await service.calculateAndIssue({
        grossAmount: 1000,
        withholdingType: 'services',
      } as any);

      const createArg = mockRepo.create.mock.calls[0][0];
      expect(createArg.certifiedAt).toBeInstanceOf(Date);
    });
  });

  // ─── findById ─────────────────────────────────────────────
  describe('findById', () => {
    it('should return certificate when found', async () => {
      const cert = { id: 'wh-1' };
      mockRepo.findOne.mockResolvedValue(cert);

      const result = await service.findById('wh-1');

      expect(result).toEqual(cert);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findById('missing');
      expect(result).toBeNull();
    });
  });

  // ─── findByWithholdee ──────────────────────────────────────
  describe('findByWithholdee', () => {
    it('should return certificates ordered by createdAt DESC', async () => {
      const certs = [{ id: 'wh-1' }, { id: 'wh-2' }];
      mockRepo.find.mockResolvedValue(certs);

      const result = await service.findByWithholdee('w-1');

      expect(result).toEqual(certs);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { withholdeeId: 'w-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no certificates', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findByWithholdee('w-none');
      expect(result).toEqual([]);
    });
  });

  // ─── findPendingCertificates ───────────────────────────────
  describe('findPendingCertificates', () => {
    it('should return certificates with null certifiedAt', async () => {
      const certs = [{ id: 'wh-1', certifiedAt: null }];
      mockRepo.find.mockResolvedValue(certs);

      const result = await service.findPendingCertificates();

      expect(result).toEqual(certs);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { certifiedAt: expect.anything() },
      });
    });

    it('should return empty array when no pending certificates', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findPendingCertificates();
      expect(result).toEqual([]);
    });
  });
});
