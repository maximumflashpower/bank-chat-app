import { ComplianceWorkflowService } from './compliance-workflow.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/compliance-case.entity');

describe('ComplianceWorkflowService', () => {
  let service: ComplianceWorkflowService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    service = new ComplianceWorkflowService(mockRepo);
  });

  // ─── compileExamPackage ──────────────────────────────────────
  describe('compileExamPackage', () => {
    it('should compile package with document list', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'case-1', userId: 'entity-1' },
        { id: 'case-2', userId: 'entity-1' },
      ]);

      const result = await service.compileExamPackage('entity-1');

      expect(result.packageId).toMatch(/^PKG-/);
      expect(result.documents).toHaveLength(6); // 2 cases + 4 standard docs
      expect(result.ready).toBe(true);
      expect(result.documents).toContain('kyc_verification_record.pdf');
      expect(result.documents).toContain('aml_alert_history.csv');
      expect(result.documents).toContain('screening_results.json');
      expect(result.documents).toContain('audit_trail_export.pdf');
    });

    it('should handle zero cases with only standard docs', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.compileExamPackage('empty-entity');

      expect(result.documents).toHaveLength(4); // only standard docs
      expect(result.ready).toBe(true);
    });
  });

  // ─── certifyTrainingCompletion ───────────────────────────────
  describe('certifyTrainingCompletion', () => {
    it('should issue certificate with 1 year expiration', async () => {
      const result = await service.certifyTrainingCompletion('staff-1', 'AML_BASIC');

      expect(result.certified).toBe(true);
      expect(result.certificateId).toMatch(/^CERT-staff-1-/);
      expect(result.expiresAt.getFullYear()).toBe(new Date().getFullYear() + 1);
    });

    it('should include certification type in output', async () => {
      const result = await service.certifyTrainingCompletion('staff-2', 'KYC_ADVANCED');
      expect(result.certified).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle special characters in staffId', async () => {
      const result = await service.certifyTrainingCompletion('staff@company.com', 'SANCTIONS');
      expect(result.certified).toBe(true);
    });
  });

  // ─── requestPolicyException ──────────────────────────────────
  describe('requestPolicyException', () => {
    it('should create exception request with pending status', async () => {
      const result = await service.requestPolicyException(
        'user-1',
        'DATA_RETENTION_POLICY',
        'System upgrade requires temporary override',
        30,
      );

      expect(result.requestId).toMatch(/^EXCEPTION-/);
      expect(result.status).toBe('pending_approval');
      expect(result.reviewedBy).toBeUndefined();
    });

    it('should accept long justification text', async () => {
      const longJustification = 'x'.repeat(200);
      const result = await service.requestPolicyException('user-2', 'POLICY', longJustification, 7);
      expect(result.requestId).toBeDefined();
      expect(result.status).toBe('pending_approval');
    });

    it('should accept minimal parameters', async () => {
      const result = await service.requestPolicyException('user-3', 'SIMPLE_POLICY', 'Test', 1);
      expect(result.requestId).toBeDefined();
      expect(result.status).toBe('pending_approval');
    });
  });

  // ─── createCase ──────────────────────────────────────────────
  describe('createCase', () => {
    it('should create case with required fields', async () => {
      const saved = { id: 'case-1', status: 'open', sarGenerated: false };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createCase({
        alertId: 'alert-1',
        caseType: 'AML_INVESTIGATION',
        userId: 'user-1',
      });

      expect(result.id).toBe('case-1');
      expect(result.status).toBe('open');
      expect(result.sarGenerated).toBe(false);
      expect(result.analystId).toBeUndefined();
      expect(result.summary).toBeUndefined();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should include optional analystId', async () => {
      const saved = { id: 'case-2', analystId: 'analyst-1' };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createCase({
        alertId: 'alert-2',
        caseType: 'KYC_REVIEW',
        userId: 'user-2',
        analystId: 'analyst-1',
      });

      expect(result.analystId).toBe('analyst-1');
    });

    it('should include optional summary', async () => {
      const saved = { id: 'case-3', summary: 'Initial review needed' };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createCase({
        alertId: 'alert-3',
        caseType: 'SCREENING',
        userId: 'user-3',
        summary: 'Initial review needed',
      });

      expect(result.summary).toBe('Initial review needed');
    });
  });

  // ─── addEvidence ─────────────────────────────────────────────
  describe('addEvidence', () => {
    it('should throw NotFoundException when case not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.addEvidence('missing', { type: 'DOCUMENT', url: 'url', description: 'desc' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should initialize evidence array if undefined', async () => {
      const caseItem = { id: 'case-1', evidence: undefined };
      mockRepo.findOne.mockResolvedValue(caseItem);
      mockRepo.save.mockResolvedValue(caseItem);

      await service.addEvidence('case-1', { type: 'DOCUMENT', url: 'http://example.com/doc.pdf', description: 'PDF evidence' });

      expect(caseItem.evidence).toEqual([{ type: 'DOCUMENT', url: 'http://example.com/doc.pdf', description: 'PDF evidence' }]);
    });

    it('should append evidence to existing array', async () => {
      const caseItem = { id: 'case-2', evidence: [{ type: 'IMAGE', url: 'img.jpg', description: 'Photo' }] };
      mockRepo.findOne.mockResolvedValue(caseItem);
      mockRepo.save.mockResolvedValue(caseItem);

      await service.addEvidence('case-2', { type: 'DOCUMENT', url: 'doc.pdf', description: 'New PDF' });

      expect(caseItem.evidence).toHaveLength(2);
      expect(caseItem.evidence[1].type).toBe('DOCUMENT');
      expect(caseItem.evidence[1].url).toBe('doc.pdf');
    });
  });

  // ─── closeCase ───────────────────────────────────────────────
  describe('closeCase', () => {
    it('should throw NotFoundException when case not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.closeCase('missing', 'Reason here')).rejects.toThrow(NotFoundException);
    });

    it('should set status to closed and set closedAt', async () => {
      const caseItem = { id: 'case-1', status: 'open', closedAt: null };
      mockRepo.findOne.mockResolvedValue(caseItem);
      mockRepo.save.mockResolvedValue(caseItem);

      const result = await service.closeCase('case-1', 'Investigation completed');

      expect(result.status).toBe('closed');
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it('should set summary if not already set', async () => {
      const caseItem = { id: 'case-2', status: 'open', closedAt: null, summary: null };
      mockRepo.findOne.mockResolvedValue(caseItem);
      mockRepo.save.mockResolvedValue(caseItem);

      await service.closeCase('case-2', 'Closed due to false positive');

      expect(caseItem.summary).toContain('Case closed');
      expect(caseItem.summary).toContain('Closed due to false positive');
    });

    it('should preserve existing summary', async () => {
      const caseItem = { id: 'case-3', status: 'open', closedAt: null, summary: 'Existing summary' };
      mockRepo.findOne.mockResolvedValue(caseItem);
      mockRepo.save.mockResolvedValue(caseItem);

      await service.closeCase('case-3', 'New reason');

      expect(caseItem.summary).toBe('Existing summary');
    });
  });
});
