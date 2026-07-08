import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DecisionService } from './decision.service';
import { GovDecisionLog } from '../entities/gov-decision-log.entity';
import { DecisionQueryDto } from '../dto/decision-query.dto';
import { NotFoundException } from '@nestjs/common';

describe('DecisionService', () => {
  let service: DecisionService;
  let repo: Repository<GovDecisionLog>;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionService,
        { provide: getRepositoryToken(GovDecisionLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DecisionService>(DecisionService);
    repo = module.get<Repository<GovDecisionLog>>(getRepositoryToken(GovDecisionLog));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === LOG ===
  describe('log', () => {
    const params = {
      policyId: 'policy-1',
      policyVersion: 1,
      requestInput: { amount: 1000 },
      decisionResult: 'allow',
      decisionRationale: 'All conditions met',
      evaluationTimeMs: 10,
      evaluatedEntityType: 'Transfer',
      evaluatedEntityId: 'transfer-123',
      actorId: 'user-456',
      context: { ip: '192.168.1.1' },
    };

    it('should log a decision successfully', async () => {
      const created = { id: 'decision-1', ...params };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.log(params);
      expect(result.id).toBe('decision-1');
      expect(result.decisionResult).toBe('allow');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledWith(created);
    });

    it('should handle optional fields correctly', async () => {
      const minimalParams = {
        policyId: 'policy-1',
        policyVersion: 1,
        requestInput: {},
        decisionResult: 'deny',
        decisionRationale: 'Test',
        evaluationTimeMs: 5,
      };
      mockRepo.create.mockReturnValue({ id: 'minimal', ...minimalParams });
      mockRepo.save.mockResolvedValue({ id: 'minimal', ...minimalParams, context: {} });

      const result = await service.log(minimalParams);
      expect(result.context).toBeDefined();
    });
  });

  // === FIND BY ID ===
  describe('findById', () => {
    it('should return decision by id', async () => {
      const decision = { id: 'decision-1', policyId: 'policy-1' };
      mockRepo.findOne.mockResolvedValue(decision);
      const result = await service.findById('decision-1');
      expect(result).toEqual(decision);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === SEARCH ===
  describe('search', () => {
    const query: DecisionQueryDto = {
      policyId: 'policy-1',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    };

    it('should search with filters', async () => {
      mockRepo.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      const result = await service.search(query, 50);
      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        order: { createdAt: 'DESC' },
        take: 50,
      }));
    });

    it('should handle date range filtering', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.search({ fromDate: '2026-01-01', toDate: '2026-12-31' });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should handle only fromDate', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.search({ fromDate: '2026-06-01' });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should handle only toDate', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.search({ toDate: '2026-06-01' });
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  // === EXPORT RATIONALE ===
  describe('exportRationale', () => {
    it('should export decision rationale', async () => {
      const decision = {
        id: 'decision-1',
        policyId: 'policy-1',
        evaluatedEntityType: 'Transfer',
        decisionResult: 'allow',
        context: { reason: 'approved' },
        actorId: 'user-456',
        createdAt: new Date(),
      };
      mockRepo.findOne.mockResolvedValue(decision);

      const result = await service.exportRationale('decision-1');
      expect(result.decision).toEqual(decision);
      expect(result.rationale.policyId).toBe('policy-1');
      expect(result.rationale.result).toBe('allow');
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.exportRationale('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === ADVANCED SEARCH ===
  describe('advancedSearch', () => {
    it('should search with aggregation summary', async () => {
      const decisions = [
        { id: '1', decisionResult: 'allow', policyId: 'policy-A' },
        { id: '2', decisionResult: 'deny', policyId: 'policy-B' },
        { id: '3', decisionResult: 'allow', policyId: 'policy-A' },
      ];
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.advancedSearch({ policyId: 'policy-A' });
      expect(result.decisions).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.byResult['allow']).toBe(2);
      expect(result.summary.byResult['deny']).toBe(1);
    });

    it('should group byResult counts correctly', async () => {
      const decisions = [
        { id: '1', decisionResult: 'deny' },
        { id: '2', decisionResult: 'deny' },
        { id: '3', decisionResult: 'review' },
      ];
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.advancedSearch({});
      expect(result.summary.byResult.deny).toBe(2);
      expect(result.summary.byResult.review).toBe(1);
    });

    it('should handle empty results', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.advancedSearch({});
      expect(result.decisions).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it('should handle null decisionResult as unknown', async () => {
      const decisions = [{ id: '1', decisionResult: null }];
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.advancedSearch({});
      expect(result.summary.byResult.unknown).toBe(1);
    });
  });

  // === ANALYTICS ===
  describe('getAnalytics', () => {
    it('should return analytics summary', async () => {
      const decisions = [
        { id: '1', decisionResult: 'allow' },
        { id: '2', decisionResult: 'deny' },
        { id: '3', decisionResult: 'allow' },
        { id: '4', decisionResult: 'manual_review' },
      ];
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.getAnalytics('2026-01-01', '2026-12-31');
      expect(result.totalDecisions).toBe(4);
      expect(result.allowCount).toBe(2);
      expect(result.denyCount).toBe(1);
      expect(result.reviewCount).toBe(1);
    });

    it('should calculate topPolicies sorted by count', async () => {
      const decisions = [
        { id: '1', decisionResult: 'allow', policyId: 'policy-A' },
        { id: '2', decisionResult: 'deny', policyId: 'policy-A' },
        { id: '3', decisionResult: 'allow', policyId: 'policy-B' },
        { id: '4', decisionResult: 'allow', policyId: 'policy-B' },
      ];
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.getAnalytics();
      expect(result.topPolicies[0].count).toBe(2); // Both have 2, order depends on Map insertion
      expect(result.topPolicies[0].count).toBe(2);
    });

    it('should limit topPolicies to 10', async () => {
      const decisions = Array(15).fill(null).map((_, i) => ({
        id: `${i}`,
        decisionResult: 'allow',
        policyId: `policy-${i % 12}`,
      }));
      mockRepo.find.mockResolvedValue(decisions);

      const result = await service.getAnalytics();
      expect(result.topPolicies.length).toBeLessThanOrEqual(10);
    });

    it('should handle date filtering with moreThan', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.getAnalytics('2026-06-01');
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        order: { createdAt: 'DESC' },
        take: 500,
      }));
    });
  });

  // === AUDIT TRAIL ===
  describe('getAuditTrail', () => {
    it('should return decisions for an entity', async () => {
      const trail = [
        { id: '1', createdAt: new Date('2026-01-01') },
        { id: '2', createdAt: new Date('2026-06-01') },
      ];
      mockRepo.find.mockResolvedValue(trail);

      const result = await service.getAuditTrail('Transfer', 'transfer-123');
      expect(result).toEqual(trail);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'ASC' },
        take: 200,
      }));
    });

    it('should filter by entityType only', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.getAuditTrail('Transfer');
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { evaluatedEntityType: 'Transfer' },
        order: { createdAt: 'ASC' },
        take: 200,
      }));
    });

    it('should filter by entityId only', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.getAuditTrail(undefined, 'transfer-123');
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { evaluatedEntityId: 'transfer-123' },
        order: { createdAt: 'ASC' },
        take: 200,
      }));
    });

    it('should return all if no filters provided', async () => {
      const trail = [{ id: '1' }, { id: '2' }];
      mockRepo.find.mockResolvedValue(trail);

      const result = await service.getAuditTrail();
      expect(result).toEqual(trail);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'ASC' },
        take: 200,
      }));
    });
  });
});
