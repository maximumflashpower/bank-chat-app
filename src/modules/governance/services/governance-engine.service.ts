import { Injectable, Logger } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { DecisionService } from './decision.service';
import { ViolationService } from './violation.service';
import { EvaluateRequestDto } from '../dto/evaluate-request.dto';
import { EnforcementMode } from '../entities/enforcement-mode.enum';
import { DecisionResult } from '../entities/decision-result.enum';
import { Severity } from '../entities/severity.enum';

export interface EvaluationResult {
  result: DecisionResult;
  rationale: string;
  evaluationTimeMs: number;
  decisions: Array<{
    policyId: string;
    policyName: string;
    version: number;
    result: string;
    rationale: string;
  }>;
}

@Injectable()
export class GovernanceEngineService {
  private readonly logger = new Logger(GovernanceEngineService.name);

  constructor(
    private readonly policyService: PolicyService,
    private readonly decisionService: DecisionService,
    private readonly violationService: ViolationService,
  ) {}

  async evaluate(
    dto: EvaluateRequestDto,
    actorId?: string,
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    const policies = await this.policyService.getActivePolicies(dto.domain);
    this.logger.debug(
      `Euating against ${policies.length} active policies${dto.domain ? ` in domain: ${dto.domain}` : ''}`,
    );

    const decisions: EvaluationResult['decisions'] = [];
    let finalResult = DecisionResult.PERMIT;
    const rationales: string[] = [];

    for (const policy of policies) {
      const evalResult = this.policyService.evaluateJsonRules(
        policy.codeContent,
        dto.input,
      );

      decisions.push({
        policyId: policy.id,
        policyName: policy.name,
        version: policy.version,
        result: evalResult.result,
        rationale: evalResult.rationale,
      });

      // Log decision
      await this.decisionService.log({
        policyId: policy.id,
        policyVersion: policy.version,
        requestInput: dto.input,
        decisionResult: evalResult.result,
        decisionRationale: evalResult.rationale,
        evaluationTimeMs: Date.now() - startTime,
        evaluatedEntityType: dto.evaluatedEntityType,
        evaluatedEntityId: dto.evaluatedEntityId,
        actorId,
        context: dto.context,
      });

      // If enforce mode and deny, create violation
      if (
        (evalResult.result === 'deny' ||
          evalResult.result === DecisionResult.DENY) &&
        policy.enforcementMode === EnforcementMode.ENFORCE
      ) {
        await this.violationService.create({
          policyId: policy.id,
          entityType: dto.evaluatedEntityType || 'unknown',
          entityId: dto.evaluatedEntityId || 'unknown',
          violationDetail: evalResult.rationale,
          severity: policy.severity,
        });
      }

      // Aggregate final result
      if (
        evalResult.result === 'deny' ||
        evalResult.result === DecisionResult.DENY
      ) {
        finalResult = DecisionResult.DENY;
        rationales.push(`${policy.name}: ${evalResult.rationale}`);
      } else if (
        evalResult.result === 'conditional' &&
        finalResult !== DecisionResult.DENY
      ) {
        finalResult = DecisionResult.CONDITIONAL;
        rationales.push(`${policy.name}: ${evalResult.rationale}`);
      }
    }

    const evaluationTimeMs = Date.now() - startTime;
    const finalRationale =
      rationales.length > 0
        ? rationales.join('; ')
        : 'All policies permitted the request';

    this.logger.log(
      `Evaluation complete: result=${finalResult} — ${policies.length} policies — ${evaluationTimeMs}ms`,
    );

    return {
      result: finalResult,
      rationale: finalRationale,
      evaluationTimeMs,
      decisions,
    };
  }

  async getDashboard(): Promise<{
    totalPolicies: number;
    activePolicies: number;
    totalDecisions: number;
    totalViolations: number;
    openViolations: number;
    driftSummary: any;
  }> {
    const allPolicies = await this.policyService.findAll();
    const activePolicies = allPolicies.filter((p) => p.status === 'active');
    const violations = await this.violationService.findAll();

    return {
      totalPolicies: allPolicies.length,
      activePolicies: activePolicies.length,
      totalDecisions: 0,
      totalViolations: violations.length,
      openViolations: violations.filter((v) => v.status === 'open').length,
      driftSummary: null,
    };
  }

  // BBC-POLICY-V3-001: Advanced Policy Composition (modular reuse)
  async composePolicies(parentPolicyId: string, childPolicyIds: string[]): Promise<{ composed: any; parentPolicyId: string; childCount: number }> {
    const parent = await this.policyService.findOne(parentPolicyId);
    const children = [];
    for (const childId of childPolicyIds) {
      const child = await this.policyService.findOne(childId);
      children.push({ id: child.id, name: child.name, codeContent: child.codeContent });
    }
    const composed = {
      parent: { id: parent.id, name: parent.name, domain: parent.domain },
      children: children.map((c) => ({ id: c.id, name: c.name })),
      composedRules: children.map((c) => c.codeContent).join('\n\n--- MODULAR REUSE ---\n\n'),
    };
    return { composed, parentPolicyId, childCount: children.length };
  }

  // BBC-POLICY-V3-002: Dynamic Policy Generation
  async generateDynamicPolicy(template: { domain: string; rules: string[]; conditions?: Record<string, any> }): Promise<{ generatedCode: string; policyName: string }> {
    const conditionsBlock = template.conditions
      ? `\n// Conditions: ${JSON.stringify(template.conditions)}`
      : '';
    const rulesBlock = template.rules.map((r, i) => `  rule_${i + 1}: ${r}`).join('\n');
    const generatedCode = `// Auto-generated policy\n// Domain: ${template.domain}\n${conditionsBlock}\n\nrules:\n${rulesBlock}`;
    const policyName = `dynamic-${template.domain}-${Date.now()}`;
    return { generatedCode, policyName };
  }

  // BBC-POLICY-V3-003: Policy Impact Analysis
  async analyzePolicyImpact(policyId: string): Promise<{ policyId: string; affectedEntities: number; estimatedViolations: number; riskLevel: string }> {
    const policy = await this.policyService.findOne(policyId);
    const decisions = await this.decisionService.getAuditTrail(policy.domain, undefined);
    const affectedEntities = new Set(decisions.map((d) => d.evaluatedEntityId)).size;
    const violations = await this.violationService.findAll({ policyId });
    const estimatedViolations = violations.length;
    let riskLevel = 'low';
    if (estimatedViolations > 10) riskLevel = 'high';
    else if (estimatedViolations > 3) riskLevel = 'medium';
    return { policyId, affectedEntities, estimatedViolations, riskLevel };
  }

  // BBC-POLICY-V3-004: Federated Policy Evaluation
  async federatedEvaluate(input: Record<string, any>, policyIds: string[]): Promise<{ results: any[]; aggregatedResult: string }> {
    const results = [];
    for (const policyId of policyIds) {
      try {
        const result = await this.policyService.dryRunTest(policyId, input);
        results.push({ policyId, result });
      } catch (err) {
        results.push({ policyId, result: 'error', error: err.message });
      }
    }
    const denyCount = results.filter((r) => { const val = typeof r.result === "string" ? r.result : String(r.result?.result ?? ""); return val.includes("deny"); }).length;
    const aggregatedResult = denyCount > results.length / 2 ? 'deny' : 'allow';
    return { results, aggregatedResult };
  }

  // BBC-POLICY-V3-005: Policy Heatmap Visualization
  async getPolicyHeatmap(): Promise<{ heatmap: any[]; domains: string[]; maxSeverity: number }> {
    const policies = await this.policyService.findAll();
    const domainMap = new Map<string, any>();
    for (const p of policies) {
      const domain = String(p.domain ?? 'unknown');
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { domain, total: 0, active: 0, bySeverity: {} });
      }
      const entry = domainMap.get(domain);
      entry.total++;
      if (p.status === 'active') entry.active++;
      const sev = String(p.severity ?? 'medium');
      entry.bySeverity[sev] = (entry.bySeverity[sev] ?? 0) + 1;
    }
    const heatmap = Array.from(domainMap.values());
    const maxSeverity = Math.max(0, ...heatmap.map((e) => Object.values(e.bySeverity as Record<string, number>).reduce((a, b) => a + b, 0)));
    return { heatmap, domains: heatmap.map((e) => e.domain), maxSeverity };
  }

  // GOV-MOD-001: AI Policy Recommendation
  async recommendPolicy(violationPatterns: { domain: string; frequentViolations: string[] }): Promise<{ recommendedRules: string[]; suggestedDomain: string; confidence: number }> {
    const recommendedRules: string[] = [];
    for (const violation of violationPatterns.frequentViolations) {
      recommendedRules.push(`IF ${violation} THEN enforce mandatory_review AND notify_compliance_team`);
    }
    const confidence = violationPatterns.frequentViolations.length > 5 ? 0.85 : 0.65;
    return {
      recommendedRules,
      suggestedDomain: violationPatterns.domain,
      confidence,
    };
  }

  // GOV-MOD-002: Predictive Compliance
  async predictComplianceRisk(historicalData: { totalPolicies: number; violationRate: number; driftCount: number; attestationRate: number }): Promise<{ predictedRiskScore: number; riskLevel: string; recommendations: string[] }> {
    const weightedScore =
      historicalData.violationRate * 40 +
      (1 - historicalData.attestationRate) * 30 +
      historicalData.driftCount * 3;
    const predictedRiskScore = Math.min(100, Math.round(weightedScore));
    let riskLevel = 'low';
    if (predictedRiskScore > 70) riskLevel = 'critical';
    else if (predictedRiskScore > 50) riskLevel = 'high';
    else if (predictedRiskScore > 30) riskLevel = 'medium';
    const recommendations: string[] = [];
    if (historicalData.violationRate > 0.3) recommendations.push('Increase policy enforcement strictness');
    if (historicalData.attestationRate < 0.7) recommendations.push('Prioritize pending attestations');
    if (historicalData.driftCount > 5) recommendations.push('Review and remediate configuration drift');
    return { predictedRiskScore, riskLevel, recommendations };
  }
}
