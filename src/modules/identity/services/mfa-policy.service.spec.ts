import { MfaPolicyService } from './mfa-policy.service';

describe('MfaPolicyService', () => {
  let service: MfaPolicyService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      delete: jest.fn(),
    };
    service = new MfaPolicyService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // createPolicy
  // ═══════════════════════════════════════════════════
  describe('createPolicy', () => {
    it('should create and save a policy', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createPolicy('Strict MFA', 'admin-1', {
        riskThresholdHigh: 7.0,
      } as any);
      expect(result.name).toBe('Strict MFA');
      expect(result.createdBy).toBe('admin-1');
      expect(result.riskThresholdHigh).toBe(7.0);
    });

    it('should work without optional dto', async () => {
      repo.create.mockImplementation((data: any) => ({ ...data }));
      repo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createPolicy('Basic MFA', 'admin-2');
      expect(result.name).toBe('Basic MFA');
      expect(result.createdBy).toBe('admin-2');
    });
  });

  // ═══════════════════════════════════════════════════
  // updatePolicy
  // ═══════════════════════════════════════════════════
  describe('updatePolicy', () => {
    it('should update and return the updated policy', async () => {
      const updated = { id: 'p1', name: 'Updated', riskThresholdHigh: 8.0 };
      repo.findOneOrFail.mockResolvedValue(updated);

      const result = await service.updatePolicy('p1', { riskThresholdHigh: 8.0 } as any);
      expect(repo.update).toHaveBeenCalledWith('p1', { riskThresholdHigh: 8.0 });
      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(result.riskThresholdHigh).toBe(8.0);
    });
  });

  // ═══════════════════════════════════════════════════
  // getActivePolicy
  // ═══════════════════════════════════════════════════
  describe('getActivePolicy', () => {
    it('should return the most recent policy', async () => {
      const policy = { id: 'p1', name: 'Latest' };
      repo.findOne.mockResolvedValue(policy);

      const result = await service.getActivePolicy();
      expect(result).toBe(policy);
      expect(repo.findOne).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('should return null when no policy exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.getActivePolicy();
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // deletePolicy
  // ═══════════════════════════════════════════════════
  describe('deletePolicy', () => {
    it('should delete policy by ID', async () => {
      await service.deletePolicy('p1');
      expect(repo.delete).toHaveBeenCalledWith('p1');
    });
  });

  // ═══════════════════════════════════════════════════
  // evaluateRiskContext
  // ═══════════════════════════════════════════════════
  describe('evaluateRiskContext', () => {
    it('should return false when no active policy exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.evaluateRiskContext(9.0, true, 'MX', 3);
      expect(result).toBe(false);
    });

    it('should return true when riskScore >= riskThresholdHigh', async () => {
      repo.findOne.mockResolvedValue({ riskThresholdHigh: 5.0 });

      const result = await service.evaluateRiskContext(7.0, true, 'MX', 3);
      expect(result).toBe(true);
    });

    it('should return false when riskScore < riskThresholdHigh', async () => {
      repo.findOne.mockResolvedValue({ riskThresholdHigh: 5.0 });

      const result = await service.evaluateRiskContext(3.0, false, 'US', 12);
      expect(result).toBe(false);
    });

    it('should use default threshold of 5.0 when riskThresholdHigh is NaN', async () => {
      repo.findOne.mockResolvedValue({ riskThresholdHigh: 'not-a-number' });

      const result = await service.evaluateRiskContext(5.0, true, 'BR', 2);
      expect(result).toBe(true);
    });

    it('should use default threshold of 5.0 when riskThresholdHigh is undefined', async () => {
      repo.findOne.mockResolvedValue({});

      const result = await service.evaluateRiskContext(4.9, false, 'US', 10);
      expect(result).toBe(false);
    });

    it('should return true when riskScore equals threshold exactly', async () => {
      repo.findOne.mockResolvedValue({ riskThresholdHigh: 8.0 });

      const result = await service.evaluateRiskContext(8.0, false, 'US', 14);
      expect(result).toBe(true);
    });
  });
});
