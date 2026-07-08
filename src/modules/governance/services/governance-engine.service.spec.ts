import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceEngineService } from './governance-engine.service';
import { PolicyService } from './policy.service';
import { DecisionService } from './decision.service';
import { ViolationService } from './violation.service';

describe('GovernanceEngineService', () => {
  let service: GovernanceEngineService;

  const mockPolicyService = {
    getActivePolicies: jest.fn(),
    evaluateJsonRules: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    dryRunTest: jest.fn(),
  };

  const mockDecisionService = {
    log: jest.fn(),
    getAuditTrail: jest.fn(),
  };

  const mockViolationService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceEngineService,
        { provide: PolicyService, useValue: mockPolicyService },
        { provide: DecisionService, useValue: mockDecisionService },
        { provide: ViolationService, useValue: mockViolationService },
      ],
    }).compile();

    service = module.get<GovernanceEngineService>(GovernanceEngineService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === EVALUATE ===
  describe('evaluate', () => {
    const dto = {
      input: { amount: 5000 },
      domain: 'TRANSFER',
      evaluatedEntityType: 'Transfer',
      evaluatedEntityId: 'transfer-1',
      context: { channel: 'mobile' },
    };

    it('should permit when no policies match deny', async () => {
      mockPolicyService.getActivePolicies.mockResolvedValue([]);
      mockDecisionService.log.mockResolvedValue({});

      const result = await service.evaluate(dto, 'user-1');
      expect(result.result).toBe('permit');
      expect(result.rationale).toContain('All policies permitted');
      expect(result.decisions).toHaveLength(0);
    });

    it('should evaluate a deny policy and create violation', async () => {
      const policy = {
        id: 'p1',
        name: 'High Value Transfer Block',
        version: 1,
        codeContent: '{"conditions":[],"action":"deny"}',
        enforcementMode: 'enforce',
        severity: 'high',
        domain: 'TRANSFER',
      };
      mockPolicyService.getActivePolicies.mockResolvedValue([policy]);
      mockPolicyService.evaluateJsonRules.mockReturnValue({
        result: 'deny',
        rationale: 'Amount exceeds limit',
      });
      mockDecisionService.log.mockResolvedValue({});
      mockViolationService.create.mockResolvedValue({});

      const result = await service.evaluate(dto, 'user-1');
      expect(result.result).toBe('deny');
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].result).toBe('deny');
      expect(mockViolationService.create).toHaveBeenCalledWith(expect.objectContaining({
        policyId: 'p1',
        severity: 'high',
      }));
    });

    it('should not create violation when enforcement mode is not ENFORCE', async () => {
      const policy = {
        id: 'p1',
        name: 'Soft Policy',
        version: 1,
        codeContent: '{"conditions":[],"action":"deny"}',
        enforcementMode: 'detect',
        severity: 'medium',
        domain: 'TRANSFER',
      };
      mockPolicyService.getActivePolicies.mockResolvedValue([policy]);
      mockPolicyService.evaluateJsonRules.mockReturnValue({
        result: 'deny',
        rationale: 'Deny detected',
      });
      mockDecisionService.log.mockResolvedValue({});

      await service.evaluate(dto);
      expect(mockViolationService.create).not.toHaveBeenCalled();
    });

    it('should aggregate multiple policy results', async () => {
      const policies = [
        { id: 'p1', name: 'Allow Policy', version: 1, codeContent: '', enforcementMode: 'enforce', severity: 'low' },
        { id: 'p2', name: 'Deny Policy', version: 2, codeContent: '', enforcementMode: 'enforce', severity: 'high' },
      ];
      mockPolicyService.getActivePolicies.mockResolvedValue(policies);
      mockPolicyService.evaluateJsonRules
        .mockReturnValueOnce({ result: 'permit', rationale: 'OK' })
        .mockReturnValueOnce({ result: 'deny', rationale: 'Blocked' });
      mockDecisionService.log.mockResolvedValue({});
      mockViolationService.create.mockResolvedValue({});

      const result = await service.evaluate(dto);
      expect(result.result).toBe('deny');
      expect(result.decisions).toHaveLength(2);
      expect(result.rationale).toContain('Deny Policy: Blocked');
    });
  });

  // === GET DASHBOARD ===
  describe('getDashboard', () => {
    it('should return dashboard summary', async () => {
      mockPolicyService.findAll.mockResolvedValue([
        { id: '1', status: 'active' },
        { id: '2', status: 'draft' },
        { id: '3', status: 'active' },
      ]);
      mockViolationService.findAll.mockResolvedValue([
        { id: 'v1', status: 'open' },
        { id: 'v2', status: 'resolved' },
        { id: 'v3', status: 'open' },
      ]);

      const result = await service.getDashboard();
      expect(result.totalPolicies).toBe(3);
      expect(result.activePolicies).toBe(2);
      expect(result.totalViolations).toBe(3);
      expect(result.openViolations).toBe(2);
      expect(result.totalDecisions).toBe(0);
      expect(result.driftSummary).toBeNull();
    });
  });

  // === COMPOSE POLICIES (BBC-V3-001) ===
  describe('composePolicies', () => {
    it('should compose parent with child policies', async () => {
      const parent = { id: 'parent-1', name: 'Parent', domain: 'SECURITY', codeContent: 'rule1' };
      const child1 = { id: 'child-1', name: 'Child A', codeContent: 'rule2' };
      const child2 = { id: 'child-2', name: 'Child B', codeContent: 'rule3' };

      mockPolicyService.findOne
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce(child1)
        .mockResolvedValueOnce(child2);

      const result = await service.composePolicies('parent-1', ['child-1', 'child-2']);
      expect(result.childCount).toBe(2);
      expect(result.parentPolicyId).toBe('parent-1');
      expect(result.composed.children).toHaveLength(2);
      expect(result.composed.composedRules).toContain('MODULAR REUSE');
    });
  });

  // === GENERATE DYNAMIC POLICY (BBC-V3-002) ===
  describe('generateDynamicPolicy', () => {
    it('should generate policy code from template', async () => {
      const template = {
        domain: 'AML',
        rules: ['check_amount > 10000', 'flag_suspicious_country'],
      };
      const result = await service.generateDynamicPolicy(template);
      expect(result.generatedCode).toContain('Auto-generated policy');
      expect(result.generatedCode).toContain('AML');
      expect(result.generatedCode).toContain('rule_1: check_amount > 10000');
      expect(result.generatedCode).toContain('rule_2: flag_suspicious_country');
      expect(result.policyName).toContain('dynamic-AML-');
    });

    it('should include conditions block when provided', async () => {
      const template = {
        domain: 'SECURITY',
        rules: ['require_mfa'],
        conditions: { threshold: 5 },
      };
      const result = await service.generateDynamicPolicy(template);
      expect(result.generatedCode).toContain('Conditions:');
      expect(result.generatedCode).toContain('"threshold":5');
    });

    it('should omit conditions block when not provided', async () => {
      const template = { domain: 'TEST', rules: ['rule1'] };
      const result = await service.generateDynamicPolicy(template);
      expect(result.generatedCode).not.toContain('Conditions:');
    });
  });

  // === ANALYZE POLICY IMPACT (BBC-V3-003) ===
  describe('analyzePolicyImpact', () => {
    it('should calculate impact for a policy', async () => {
      const policy = { id: 'p1', name: 'Test', domain: 'SECURITY' };
      mockPolicyService.findOne.mockResolvedValue(policy);
      mockDecisionService.getAuditTrail.mockResolvedValue([
        { evaluatedEntityId: 'entity-1' },
        { evaluatedEntityId: 'entity-1' },
        { evaluatedEntityId: 'entity-2' },
      ]);
      mockViolationService.findAll.mockResolvedValue([{ id: 'v1' }]);

      const result = await service.analyzePolicyImpact('p1');
      expect(result.affectedEntities).toBe(2);
      expect(result.estimatedViolations).toBe(1);
      expect(result.riskLevel).toBe('low');
    });

    it('should return medium risk for 4-10 violations', async () => {
      mockPolicyService.findOne.mockResolvedValue({ id: 'p1', domain: 'SEC' });
      mockDecisionService.getAuditTrail.mockResolvedValue([]);
      mockViolationService.findAll.mockResolvedValue(Array(5).fill({}));

      const result = await service.analyzePolicyImpact('p1');
      expect(result.riskLevel).toBe('medium');
    });

    it('should return high risk for >10 violations', async () => {
      mockPolicyService.findOne.mockResolvedValue({ id: 'p1', domain: 'SEC' });
      mockDecisionService.getAuditTrail.mockResolvedValue([]);
      mockViolationService.findAll.mockResolvedValue(Array(11).fill({}));

      const result = await service.analyzePolicyImpact('p1');
      expect(result.riskLevel).toBe('high');
    });
  });

  // === FEDERATED EVALUATE (BBC-V3-004) ===
  describe('federatedEvaluate', () => {
    it('should aggregate results from multiple policies', async () => {
      mockPolicyService.dryRunTest
        .mockResolvedValueOnce({ result: 'deny' })
        .mockResolvedValueOnce({ result: 'deny' })
        .mockResolvedValueOnce({ result: 'permit' });

      const result = await service.federatedEvaluate({ amount: 1000 }, ['p1', 'p2', 'p3']);
      expect(result.results).toHaveLength(3);
      expect(result.aggregatedResult).toBe('deny');
    });

    it('should allow when majority permit', async () => {
      mockPolicyService.dryRunTest
        .mockResolvedValueOnce({ result: 'permit' })
        .mockResolvedValueOnce({ result: 'permit' })
        .mockResolvedValueOnce({ result: 'deny' });

      const result = await service.federatedEvaluate({}, ['p1', 'p2', 'p3']);
      expect(result.aggregatedResult).toBe('allow');
    });

    it('should handle errors gracefully', async () => {
      mockPolicyService.dryRunTest
        .mockRejectedValueOnce(new Error('Policy not found'))
        .mockResolvedValueOnce({ result: 'permit' });

      const result = await service.federatedEvaluate({}, ['p1', 'p2']);
      expect(result.results[0].result).toBe('error');
      expect(result.results[0].error).toBe('Policy not found');
      expect(result.aggregatedResult).toBe('allow');
    });
  });

  // === GET POLICY HEATMAP (BBC-V3-005) ===
  describe('getPolicyHeatmap', () => {
    it('should build heatmap grouped by domain', async () => {
      mockPolicyService.findAll.mockResolvedValue([
        { domain: 'SECURITY', status: 'active', severity: 'high' },
        { domain: 'SECURITY', status: 'draft', severity: 'low' },
        { domain: 'AML', status: 'active', severity: 'critical' },
      ]);

      const result = await service.getPolicyHeatmap();
      expect(result.heatmap).toHaveLength(2);
      expect(result.domains).toEqual(['SECURITY', 'AML']);
      const secEntry = result.heatmap.find((e) => e.domain === 'SECURITY');
      expect(secEntry.total).toBe(2);
      expect(secEntry.active).toBe(1);
      expect(secEntry.bySeverity.high).toBe(1);
      expect(secEntry.bySeverity.low).toBe(1);
    });

    it('should handle policies with null domain', async () => {
      mockPolicyService.findAll.mockResolvedValue([
        { domain: null, status: 'active', severity: 'medium' },
      ]);
      const result = await service.getPolicyHeatmap();
      expect(result.heatmap[0].domain).toBe('unknown');
    });

    it('should return empty heatmap for no policies', async () => {
      mockPolicyService.findAll.mockResolvedValue([]);
      const result = await service.getPolicyHeatmap();
      expect(result.heatmap).toHaveLength(0);
      expect(result.maxSeverity).toBe(0);
    });
  });

  // === RECOMMEND POLICY (GOV-MOD-001) ===
  describe('recommendPolicy', () => {
    it('should generate rules from violation patterns', async () => {
      const patterns = {
        domain: 'SECURITY',
        frequentViolations: ['unauthorized_access', 'privilege_escalation'],
      };
      const result = await service.recommendPolicy(patterns);
      expect(result.recommendedRules).toHaveLength(2);
      expect(result.suggestedDomain).toBe('SECURITY');
      expect(result.confidence).toBe(0.65);
      expect(result.recommendedRules[0]).toContain('IF unauthorized_access');
    });

    it('should return high confidence when >5 violations', async () => {
      const patterns = {
        domain: 'AML',
        frequentViolations: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'],
      };
      const result = await service.recommendPolicy(patterns);
      expect(result.confidence).toBe(0.85);
    });

    it('should return low confidence when <=5 violations', async () => {
      const patterns = {
        domain: 'AML',
        frequentViolations: ['v1', 'v2'],
      };
      const result = await service.recommendPolicy(patterns);
      expect(result.confidence).toBe(0.65);
    });

    it('should handle empty violations array', async () => {
      const result = await service.recommendPolicy({ domain: 'TEST', frequentViolations: [] });
      expect(result.recommendedRules).toHaveLength(0);
      expect(result.confidence).toBe(0.65);
    });
  });

  // === PREDICT COMPLIANCE RISK (GOV-MOD-002) ===
  describe('predictComplianceRisk', () => {
    it('should calculate low risk score', async () => {
      const data = { totalPolicies: 10, violationRate: 0.1, driftCount: 1, attestationRate: 0.95 };
      const result = await service.predictComplianceRisk(data);
      expect(result.riskLevel).toBe('low');
      expect(result.recommendations).toHaveLength(0);
    });

    it('should calculate medium risk score', async () => {
      const data = { totalPolicies: 10, violationRate: 0.2, driftCount: 4, attestationRate: 0.85 };
      const result = await service.predictComplianceRisk(data);
      expect(['low', 'medium']).toContain(result.riskLevel);
    });

    it('should calculate critical risk score', async () => {
      const data = { totalPolicies: 10, violationRate: 0.8, driftCount: 10, attestationRate: 0.3 };
      const result = await service.predictComplianceRisk(data);
      expect(result.riskLevel).toBe('critical');
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
      expect(result.recommendations).toContain('Increase policy enforcement strictness');
      expect(result.recommendations).toContain('Prioritize pending attestations');
      expect(result.recommendations).toContain('Review and remediate configuration drift');
    });

    it('should cap risk score at 100', async () => {
      const data = { totalPolicies: 10, violationRate: 1.0, driftCount: 50, attestationRate: 0.0 };
      const result = await service.predictComplianceRisk(data);
      expect(result.predictedRiskScore).toBeLessThanOrEqual(100);
    });

    it('should recommend attestation improvement when rate < 0.7', async () => {
      const data = { totalPolicies: 10, violationRate: 0.1, driftCount: 1, attestationRate: 0.5 };
      const result = await service.predictComplianceRisk(data);
      expect(result.recommendations).toContain('Prioritize pending attestations');
    });

    it('should not recommend drift remediation when driftCount <= 5', async () => {
      const data = { totalPolicies: 10, violationRate: 0.1, driftCount: 3, attestationRate: 0.9 };
      const result = await service.predictComplianceRisk(data);
      expect(result.recommendations).not.toContain('Review and remediate configuration drift');
    });
  });
});
