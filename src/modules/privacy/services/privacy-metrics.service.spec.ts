jest.mock('../entities/dsar-request.entity');
jest.mock('../entities/consent.entity');
jest.mock('../entities/processing-activity.entity');
jest.mock('../entities/breach-notification.entity');
jest.mock('../entities/retention-schedule.entity');
jest.mock('../entities/policy-version.entity');
jest.mock('../entities/third-party-processor.entity');

import { PrivacyMetricsService } from './privacy-metrics.service';
import { DsarStatus } from '../entities/dsar-status.enum';
import { PolicyVersionStatus } from '../entities/policy-version-status.enum';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';

describe('PrivacyMetricsService', () => {
  let service: PrivacyMetricsService;
  let dsarRepo: any;
  let consentRepo: any;
  let processingActivityRepo: any;
  let breachRepo: any;
  let retentionRepo: any;
  let policyRepo: any;
  let thirdPartyRepo: any;

  const createMockQB = (result: any) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(result || []),
    getRawOne: jest.fn().mockResolvedValue(result || {}),
    getCount: jest.fn().mockResolvedValue(Array.isArray(result) ? result.length : 0),
    getMany: jest.fn().mockResolvedValue(result || []),
  });

  beforeEach(() => {
    dsarRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    consentRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    processingActivityRepo = { count: jest.fn() };
    breachRepo = { count: jest.fn() };
    retentionRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    policyRepo = { count: jest.fn() };
    thirdPartyRepo = { count: jest.fn() };

    service = new PrivacyMetricsService(
      dsarRepo, consentRepo, processingActivityRepo,
      breachRepo, retentionRepo, policyRepo, thirdPartyRepo,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    beforeEach(() => {
      // DSAR counts
      dsarRepo.count.mockResolvedValue(10);
      dsarRepo.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(3)   // pending
        .mockResolvedValueOnce(5);  // completed

      // DSAR query builders
      dsarRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQB(0)) // overdue (getCount)
        .mockReturnValueOnce(createMockQB([
          { type: 'ACCESS', count: '3' }, { type: 'ERASURE', count: '7' },
        ]))
        .mockReturnValueOnce(createMockQB([
          { status: 'RECEIVED', count: '3' }, { status: 'DELIVERED', count: '7' },
        ]));

      // Consent counts
      consentRepo.count.mockResolvedValue(50);
      consentRepo.count
        .mockResolvedValueOnce(50)   // total
        .mockResolvedValueOnce(30)   // active (granted=true)
        .mockResolvedValueOnce(20);  // revoked (granted=false)

      // Consent query builder (byPurpose)
      consentRepo.createQueryBuilder.mockReturnValueOnce(createMockQB([
        { purpose: 'marketing', count: '30' }, { purpose: 'analytics', count: '20' },
      ]));

      // Processing activities
      processingActivityRepo.count.mockResolvedValue(8);
      processingActivityRepo.count
        .mockResolvedValueOnce(8)  // total
        .mockResolvedValueOnce(5)  // approved
        .mockResolvedValueOnce(3); // pending

      // Breaches
      breachRepo.count.mockResolvedValue(2);

      // Retention
      retentionRepo.count.mockResolvedValue(4);
      retentionRepo.count
        .mockResolvedValueOnce(4)  // total
        .mockResolvedValueOnce(3); // active

      // Retention QB (lastExecution)
      const lastExecDate = new Date('2026-07-01');
      retentionRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ lastExec: lastExecDate }),
      });

      // Policy
      policyRepo.count.mockResolvedValue(3);
      policyRepo.count
        .mockResolvedValueOnce(3)  // total
        .mockResolvedValueOnce(1)  // published
        .mockResolvedValueOnce(2); // draft

      // Third party
      thirdPartyRepo.count.mockResolvedValue(6);
      thirdPartyRepo.count
        .mockResolvedValueOnce(6)  // total
        .mockResolvedValueOnce(4); // active
    });

    it('should return aggregated dashboard with all sections', async () => {
      const result = await service.getDashboard();

      expect(result.generatedAt).toBeDefined();
      expect(result.dsar.total).toBe(10);
      expect(result.dsar.pending).toBe(3);
      expect(result.dsar.completed).toBe(5);
      expect(result.consent.total).toBe(50);
      expect(result.consent.active).toBe(30);
      expect(result.consent.revoked).toBe(20);
      expect(result.processingActivities.total).toBe(8);
      expect(result.processingActivities.dpoApproved).toBe(5);
      expect(result.processingActivities.pendingApproval).toBe(3);
      expect(result.breaches.total).toBe(2);
      expect(result.retention.totalSchedules).toBe(4);
      expect(result.retention.activeSchedules).toBe(3);
      expect(result.policy.totalVersions).toBe(3);
      expect(result.policy.published).toBe(1);
      expect(result.policy.draft).toBe(2);
      expect(result.thirdParty.total).toBe(6);
      expect(result.thirdParty.active).toBe(4);
    });

    it('should include DSAR breakdown by type and status', async () => {
      const result = await service.getDashboard();
      expect(result.dsar.byType).toEqual({ ACCESS: 3, ERASURE: 7 });
      expect(result.dsar.byStatus).toEqual({ RECEIVED: 3, DELIVERED: 7 });
    });

    it('should include consent breakdown by purpose', async () => {
      const result = await service.getDashboard();
      expect(result.consent.byPurpose).toEqual({ marketing: 30, analytics: 20 });
    });

    it('should include retention lastExecution as ISO string', async () => {
      const result = await service.getDashboard();
      expect(result.retention.lastExecution).toBe('2026-07-01T00:00:00.000Z');
    });

    it('should return null lastExecution when no retention has been executed', async () => {
      // Re-setup retention to return null
      retentionRepo.count.mockReset();
      retentionRepo.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      retentionRepo.createQueryBuilder.mockReset();
      retentionRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ lastExec: null }),
      });

      const result = await service.getDashboard();
      expect(result.retention.lastExecution).toBeNull();
    });
  });
});
