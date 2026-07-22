import { SecurityAuditService } from './security-audit.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;

  beforeEach(() => {
    service = new SecurityAuditService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // scheduleAccessReview
  // ═══════════════════════════════════════════════════
  describe('scheduleAccessReview', () => {
    it('should return reviewId, dueDate, and assignedTo', async () => {
      const before = new Date();
      const result = await service.scheduleAccessReview('quarterly');

      expect(result.reviewId).toEqual(expect.any(String));
      expect(result.dueDate).toBeInstanceOf(Date);
      expect(result.assignedTo).toBe('security-team');
      expect(result.dueDate.getTime()).toBeGreaterThan(before.getTime());
    });

    it('should set dueDate 3 months ahead for quarterly review', async () => {
      const now = Date.now();
      const result = await service.scheduleAccessReview('quarterly');
      const diffMonths = (result.dueDate.getTime() - now) / (1000 * 60 * 60 * 24 * 30);
      expect(diffMonths).toBeGreaterThanOrEqual(2.5);
      expect(diffMonths).toBeLessThanOrEqual(3.5);
    });

    it('should set dueDate 12 months ahead for annual review', async () => {
      const now = Date.now();
      const result = await service.scheduleAccessReview('annually');
      const diffMonths = (result.dueDate.getTime() - now) / (1000 * 60 * 60 * 24 * 30);
      expect(diffMonths).toBeGreaterThanOrEqual(11);
      expect(diffMonths).toBeLessThanOrEqual(13);
    });
  });

  // ═══════════════════════════════════════════════════
  // reviewPrivilegedAccounts
  // ═══════════════════════════════════════════════════
  describe('reviewPrivilegedAccounts', () => {
    it('should return review summary with zero counts', async () => {
      const result = await service.reviewPrivilegedAccounts();
      expect(result.totalAccounts).toBe(0);
      expect(result.flagged).toBe(0);
      expect(result.reviewed).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // assessThirdPartyVendor
  // ═══════════════════════════════════════════════════
  describe('assessThirdPartyVendor', () => {
    it('should return vendor assessment with riskScore and status', async () => {
      const result = await service.assessThirdPartyVendor('vendor-xyz');
      expect(result.vendorId).toBe('vendor-xyz');
      expect(result.riskScore).toBe(50);
      expect(result.assessmentStatus).toBe('pending');
    });
  });

  // ═══════════════════════════════════════════════════
  // schedulePenetrationTest
  // ═══════════════════════════════════════════════════
  describe('schedulePenetrationTest', () => {
    it('should return testId, scheduledDate, and scope for internal', async () => {
      const before = Date.now();
      const result = await service.schedulePenetrationTest('internal');

      expect(result.testId).toEqual(expect.any(String));
      expect(result.scheduledDate).toBeInstanceOf(Date);
      expect(result.scope).toBe('internal');
      expect(result.scheduledDate.getTime()).toBeGreaterThan(before);
    });

    it('should set scheduledDate 6 months ahead', async () => {
      const result = await service.schedulePenetrationTest('internal');
      const diffMonths = (result.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
      expect(diffMonths).toBeGreaterThanOrEqual(5);
      expect(diffMonths).toBeLessThanOrEqual(7);
    });

    it('should accept external scope', async () => {
      const result = await service.schedulePenetrationTest('external');
      expect(result.scope).toBe('external');
    });

    it('should accept both scope', async () => {
      const result = await service.schedulePenetrationTest('both');
      expect(result.scope).toBe('both');
    });
  });

  // ═══════════════════════════════════════════════════
  // runVulnerabilityScan
  // ═══════════════════════════════════════════════════
  describe('runVulnerabilityScan', () => {
    it('should return scanId, vulnerabilities array, and totalFound', async () => {
      const result = await service.runVulnerabilityScan();
      expect(result.scanId).toEqual(expect.any(String));
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
      expect(result.vulnerabilities).toEqual([]);
      expect(result.totalFound).toBe(0);
    });
  });
});
