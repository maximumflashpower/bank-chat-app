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
}
