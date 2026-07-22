import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrivacyDsarRequest, DsarStatus } from '../entities/privacy-dsar-request.entity';
import { PrivacyConsent } from '../entities/privacy-consent.entity';
import { PrivacyProcessingActivity } from '../entities/privacy-processing-activity.entity';
import { PrivacyBreachNotification } from '../entities/privacy-breach-notification.entity';
import { PrivacyMetricsService } from './privacy-metrics.service';
import { RetentionSchedule } from '../entities/retention-schedule.entity';
import { PolicyVersion } from '../entities/policy-version.entity';
import { ThirdPartyProcessor } from '../entities/third-party-processor.entity';
import { PolicyVersionStatus } from '../entities/policy-version-status.enum';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';

describe('PrivacyMetricsService', () => {
  let service: PrivacyMetricsService;
  let dsarRepo: Repository<PrivacyDsarRequest>;
  let consentRepo: Repository<PrivacyConsent>;
  let processingActivityRepo: Repository<PrivacyProcessingActivity>;
  let breachRepo: Repository<PrivacyBreachNotification>;
  let retentionRepo: Repository<RetentionSchedule>;
  let policyRepo: Repository<PolicyVersion>;
  let thirdPartyRepo: Repository<ThirdPartyProcessor>;

  const createMockQB = (result: any) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(result || []),
    getRawOne: jest.fn().mockResolvedValue(result || {}),
    getCount: jest.fn().mockResolvedValue(Array.isArray(result) ? result.length : 0),
    getMany: jest.fn().mockResolvedValue(result || []),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyMetricsService,
        { provide: getRepositoryToken(PrivacyDsarRequest), useValue: { count: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(PrivacyConsent), useValue: { count: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(PrivacyProcessingActivity), useValue: { count: jest.fn() } },
        { provide: getRepositoryToken(PrivacyBreachNotification), useValue: { count: jest.fn() } },
        { provide: getRepositoryToken(RetentionSchedule), useValue: { count: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(PolicyVersion), useValue: { count: jest.fn() } },
        { provide: getRepositoryToken(ThirdPartyProcessor), useValue: { count: jest.fn() } },
      ],
    }).compile();

    service = module.get<PrivacyMetricsService>(PrivacyMetricsService);
    dsarRepo = module.get(getRepositoryToken(PrivacyDsarRequest));
    consentRepo = module.get(getRepositoryToken(PrivacyConsent));
    processingActivityRepo = module.get(getRepositoryToken(PrivacyProcessingActivity));
    breachRepo = module.get(getRepositoryToken(PrivacyBreachNotification));
    retentionRepo = module.get(getRepositoryToken(RetentionSchedule));
    policyRepo = module.get(getRepositoryToken(PolicyVersion));
    thirdPartyRepo = module.get(getRepositoryToken(ThirdPartyProcessor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    beforeEach(() => {
      // Setup mock counts
      dsarRepo.count.mockResolvedValue(10);
      dsarRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3).mockResolvedValueOnce(5);
      dsarRepo.createQueryBuilder.mockReturnValueOnce(createMockQB(0));
      dsarRepo.createQueryBuilder.mockReturnValueOnce(createMockQB([
        { type: 'ACCESS', count: '3' }, { type: 'ERASURE', count: '7' },
      ]));
      dsarRepo.createQueryBuilder.mockReturnValueOnce(createMockQB([
        { status: 'RECEIVED', count: '3' }, { status: 'DELIVERED', count: '7' },
      ]));

      consentRepo.count.mockResolvedValue(50);
      consentRepo.count.mockResolvedValueOnce(50).mockResolvedValueOnce(30).mockResolvedValueOnce(20);
      consentRepo.createQueryBuilder.mockReturnValueOnce(createMockQB([
        { purpose: 'marketing', count: '30' }, { purpose: 'analytics', count: '20' },
      ]));

      processingActivityRepo.count.mockResolvedValue(8);
      processingActivityRepo.count.mockResolvedValueOnce(8).mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      breachRepo.count.mockResolvedValue(2);

      retentionRepo.count.mockResolvedValue(4);
      retentionRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(3);
      retentionRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ lastExec: new Date('2026-07-01') }),
      });

      policyRepo.count.mockResolvedValue(3);
      policyRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(2);

      thirdPartyRepo.count.mockResolvedValue(6);
      thirdPartyRepo.count.mockResolvedValueOnce(6).mockResolvedValueOnce(4);
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
      expect(result.breaches.total).toBe(2);
      expect(result.retention.totalSchedules).toBe(4);
      expect(result.policy.totalVersions).toBe(3);
      expect(result.thirdParty.total).toBe(6);
    });

    it('should include DSAR breakdown by type', async () => {
      const result = await service.getDashboard();
      expect(result.dsar.byType.ACCESS).toBe(3);
      expect(result.dsar.byType.ERASURE).toBe(7);
    });

    it('should include retention lastExecution as ISO string', async () => {
      const result = await service.getDashboard();
      expect(result.retention.lastExecution).toBe('2026-07-01T00:00:00.000Z');
    });
  });
});
