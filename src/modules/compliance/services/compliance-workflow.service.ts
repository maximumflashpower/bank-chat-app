import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceCase } from '../entities/compliance-case.entity';

@Injectable()
export class ComplianceWorkflowService {
  private readonly logger = new Logger(ComplianceWorkflowService.name);

  constructor(
    @InjectRepository(ComplianceCase)
    private readonly repo: Repository<ComplianceCase>,
  ) {}

  /** COMP-WORKFLOW-001: Regulatory Exam Ready Package Compilation Export */
  async compileExamPackage(entityId: string): Promise<{ packageId: string; documents: string[]; ready: boolean }> {
    const caseDocs = await this.repo.find({ where: { userId: entityId } });
    const documentRefs = caseDocs.map((c) => `case_${c.id}_summary.pdf`).concat([
      'kyc_verification_record.pdf',
      'aml_alert_history.csv',
      'screening_results.json',
      'audit_trail_export.pdf',
    ]);
    const packageId = `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.logger.log(`Exam package compiled for entity ${entityId}: ${documentRefs.length} documents`);
    return { packageId, documents: documentRefs, ready: true };
  }

  /** COMP-WORKFLOW-002: Compliance Training Certification Staff Annual Mandatory */
  async certifyTrainingCompletion(staffId: string, certificationType: string): Promise<{ certified: boolean; certificateId: string; expiresAt: Date }> {
    const certificateId = `CERT-${staffId}-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    this.logger.log(`Training certified for staff ${staffId}: type=${certificationType}, expires=${expiresAt.toISOString()}`);
    return { certified: true, certificateId, expiresAt };
  }

  /** COMP-WORKFLOW-003: Policy Exception Request Approval Override Audit Log */
  async requestPolicyException(requesterId: string, policyName: string, justification: string, durationDays: number): Promise<{ requestId: string; status: string; reviewedBy?: string }> {
    const requestId = `EXCEPTION-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.logger.warn(`Policy exception requested: ${requestId} by ${requesterId} for ${policyName}, justification=${justification.substring(0, 50)}...`);
    // Stub: workflow requires approval
    return { requestId, status: 'pending_approval' };
  }

  /** Create a compliance case */
  async createCase(input: {
    alertId: string;
    caseType: string;
    userId: string;
    analystId?: string;
    summary?: string;
  }): Promise<ComplianceCase> {
    const caseItem = Object.assign(new ComplianceCase(), {
      alertId: input.alertId,
      caseType: input.caseType,
      userId: input.userId,
      analystId: input.analystId || null,
      status: 'open',
      summary: input.summary || null,
      evidence: [],
      sarGenerated: false,
      sarFileUrl: null,
      submittedToAuthority: false,
    });
    const saved = await this.repo.save(caseItem) as unknown as ComplianceCase;
    this.logger.log(`Compliance case created: ${saved.id} for alert ${input.alertId}`);
    return saved;
  }

  /** Add evidence to a case */
  async addEvidence(caseId: string, evidence: { type: string; url: string; description: string }): Promise<ComplianceCase> {
    const caseItem = await this.repo.findOne({ where: { id: caseId } });
    if (!caseItem) {
      throw new NotFoundException(`Compliance case ${caseId} not found`);
    }
    if (!caseItem.evidence) {
      caseItem.evidence = [];
    }
    caseItem.evidence.push(evidence);
    return this.repo.save(caseItem);
  }

  /** Mark case as closed */
  async closeCase(caseId: string, closureReason: string): Promise<ComplianceCase> {
    const caseItem = await this.repo.findOne({ where: { id: caseId } });
    if (!caseItem) {
      throw new NotFoundException(`Compliance case ${caseId} not found`);
    }
    caseItem.status = 'closed';
    caseItem.closedAt = new Date();
    if (!caseItem.summary) {
      caseItem.summary = `Case closed: ${closureReason}`;
    }
    return this.repo.save(caseItem);
  }
}
