import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegCompService } from './reg-comp.service';
import { GovRegComp } from '../entities/gov-reg-comp.entity';
import { RegCompType } from '../entities/reg-comp-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('RegCompService', () => {
  let service: RegCompService;
  let repo: Repository<GovRegComp>;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegCompService,
        { provide: getRepositoryToken(GovRegComp), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<RegCompService>(RegCompService);
    repo = module.get<Repository<GovRegComp>>(getRepositoryToken(GovRegComp));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // === SCHEDULE AUDIT (REG-COMP-006) ===
  describe('scheduleAudit', () => {
    it('should create an audit schedule record', async () => {
      const config = { frequency: 'monthly', scope: 'financial' };
      const created = { id: '1', type: RegCompType.AUDIT_SCHEDULER, name: 'Audit Schedule - monthly', config, status: 'scheduled' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.scheduleAudit(config);
      expect(result.type).toBe(RegCompType.AUDIT_SCHEDULER);
      expect(result.status).toBe('scheduled');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.AUDIT_SCHEDULER,
        name: 'Audit Schedule - monthly',
      }));
    });
  });

  // === CREATE TRAINING RECORD (REG-COMP-007) ===
  describe('createTrainingRecord', () => {
    it('should create a compliance training record', async () => {
      const created = { id: '1', type: RegCompType.COMPLIANCE_TRAINING, status: 'pending' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.createTrainingRecord('user-1', 'AML Training', '2026-12-31');
      expect(result.type).toBe(RegCompType.COMPLIANCE_TRAINING);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.COMPLIANCE_TRAINING,
        assignedToUserId: 'user-1',
        status: 'pending',
      }));
    });

    it('should work without a dueDate', async () => {
      mockRepo.create.mockReturnValue({ id: '1' });
      mockRepo.save.mockResolvedValue({ id: '1' });
      await service.createTrainingRecord('user-1', 'GDPR Training');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        scheduledFor: undefined,
      }));
    });
  });

  // === CREATE DLP POLICY (REG-COMP-008) ===
  describe('createDlpPolicy', () => {
    it('should create a DLP policy record', async () => {
      const rules = [{ pattern: 'credit_card', action: 'block' }];
      const created = { id: '1', type: RegCompType.DLP_POLICY_ENGINE, status: 'active' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.createDlpPolicy('PII Protection', rules, 'high');
      expect(result.type).toBe(RegCompType.DLP_POLICY_ENGINE);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.DLP_POLICY_ENGINE,
        config: { rules, severity: 'high' },
        status: 'active',
      }));
    });
  });

  // === DETECT INSIDER THREAT (REG-COMP-009) ===
  describe('detectInsiderThreat', () => {
    it('should calculate average risk from indicators', async () => {
      const indicators = [
        { type: 'off_hours_access', severity: 4 },
        { type: 'bulk_download', severity: 2 },
      ];
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      const result = await service.detectInsiderThreat(indicators);
      expect(result.riskScore).toBe(3);
      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].type).toBe('off_hours_access');
    });

    it('should return riskScore 0 for empty indicators', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      const result = await service.detectInsiderThreat([]);
      expect(result.riskScore).toBe(0);
      expect(result.threats).toHaveLength(0);
    });

    it('should default severity to 1 when missing', async () => {
      const indicators = [{ type: 'login_anomaly' }, { type: 'download_spike' }];
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      const result = await service.detectInsiderThreat(indicators);
      expect(result.riskScore).toBe(1);
    });
  });

  // === ASSESS THIRD-PARTY RISK (REG-COMP-010) ===
  describe('assessThirdPartyRisk', () => {
    it('should create a third-party risk assessment record', async () => {
      const created = { id: '1', type: RegCompType.THIRD_PARTY_RISK, status: 'pending' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.assessThirdPartyRisk('vendor-123', 'security', { soc2: true });
      expect(result.type).toBe(RegCompType.THIRD_PARTY_RISK);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.THIRD_PARTY_RISK,
        metadata: { vendorId: 'vendor-123', assessmentType: 'security', evidence: { soc2: true } },
        status: 'pending',
      }));
    });

    it('should work without evidence', async () => {
      mockRepo.create.mockReturnValue({ id: '1' });
      mockRepo.save.mockResolvedValue({ id: '1' });
      await service.assessThirdPartyRisk('vendor-456', 'financial');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ evidence: undefined }),
      }));
    });
  });

  // === CREATE ATTESTATION (REG-COMP-011) ===
  describe('createAttestation', () => {
    it('should create an attestation record', async () => {
      const items = ['control-1', 'control-2'];
      const created = { id: '1', type: RegCompType.CONTINUOUS_ATTESTATION, isAttested: false, status: 'pending' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.createAttestation('attester-1', items);
      expect(result.isAttested).toBe(false);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.CONTINUOUS_ATTESTATION,
        assignedToUserId: 'attester-1',
        config: { items },
        isAttested: false,
      }));
    });
  });

  // === MONITOR REGULATORY CHANGE (REG-COMP-012) ===
  describe('monitorRegulatoryChange', () => {
    it('should generate changes for each jurisdiction/domain combination', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});

      const result = await service.monitorRegulatoryChange(['US', 'EU'], ['banking', 'privacy']);
      expect(result.changes).toHaveLength(4);
      expect(result.changes[0]).toEqual(expect.objectContaining({
        jurisdiction: 'US',
        domain: 'banking',
        updateType: 'amendment',
      }));
    });

    it('should return high impact when more than 5 changes', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      const result = await service.monitorRegulatoryChange(['US', 'EU', 'UK', 'APAC'], ['banking', 'privacy']);
      expect(result.changes.length).toBe(8);
      expect(result.impact).toBe('high');
    });

    it('should return medium impact when 5 or fewer changes', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({});
      const result = await service.monitorRegulatoryChange(['US'], ['banking']);
      expect(result.changes.length).toBe(1);
      expect(result.impact).toBe('medium');
    });
  });

  // === GENERATE AUTOMATED REPORT (REG-COMP-013) ===
  describe('generateAutomatedReport', () => {
    it('should create an automated report record', async () => {
      const created = { id: '1', type: RegCompType.AUTOMATED_REPORTING, status: 'generated' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.generateAutomatedReport('quarterly_summary', { quarter: 'Q1' }, ['ceo@bank.com']);
      expect(result.status).toBe('generated');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        type: RegCompType.AUTOMATED_REPORTING,
        config: { type: 'quarterly_summary', parameters: { quarter: 'Q1' }, recipients: ['ceo@bank.com'] },
        status: 'generated',
      }));
    });
  });

  // === CALCULATE COMPLIANCE METRICS (REG-COMP-014) ===
  describe('calculateComplianceMetrics', () => {
    it('should calculate metrics from records', async () => {
      const records = [
        { id: '1', isAttested: true, score: 8, completedAt: '2026-06-01' },
        { id: '2', isAttested: false, score: 5, completedAt: null },
        { id: '3', isAttested: true, score: 6, completedAt: '2026-06-02' },
      ];
      mockRepo.find.mockResolvedValue(records);

      const result = await service.calculateComplianceMetrics({ from: '2026-01-01', to: '2026-12-31' });
      expect(result.metrics.totalRecords).toBe(3);
      expect(result.metrics.completed).toBe(2);
      expect(result.metrics.pending).toBe(1);
    });

    it('should calculate overall score based on attestation and avg score', async () => {
      const records = [
        { id: '1', isAttested: true, score: 10, completedAt: '2026-06-01' },
        { id: '2', isAttested: true, score: 10, completedAt: '2026-06-02' },
      ];
      mockRepo.find.mockResolvedValue(records);

      const result = await service.calculateComplianceMetrics({ from: '2026-01-01', to: '2026-12-31' });
      expect(result.overallScore).toBe(100);
    });

    it('should handle empty records', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.calculateComplianceMetrics({ from: '2026-01-01', to: '2026-12-31' });
      expect(result.metrics.totalRecords).toBe(0);
      expect(result.overallScore).toBe(0);
    });

    it('should cap overallScore at 100', async () => {
      const records = [
        { id: '1', isAttested: true, score: 100, completedAt: '2026-06-01' },
      ];
      mockRepo.find.mockResolvedValue(records);
      const result = await service.calculateComplianceMetrics({ from: '2026-01-01', to: '2026-12-31' });
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  // === CRUD: FIND ALL ===
  describe('findAll', () => {
    it('should return all records without filters', async () => {
      const records = [{ id: '1' }, { id: '2' }];
      mockRepo.find.mockResolvedValue(records);
      const result = await service.findAll();
      expect(result).toEqual(records);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter by type', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAll(RegCompType.AUDIT_SCHEDULER);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { type: RegCompType.AUDIT_SCHEDULER },
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAll(undefined, 'active');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by both type and status', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAll(RegCompType.DLP_POLICY_ENGINE, 'active');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { type: RegCompType.DLP_POLICY_ENGINE, status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // === CRUD: FIND ONE ===
  describe('findOne', () => {
    it('should return a record by id', async () => {
      const record = { id: '1', name: 'Test' };
      mockRepo.findOne.mockResolvedValue(record);
      const result = await service.findOne('1');
      expect(result).toEqual(record);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === CRUD: UPDATE ===
  describe('update', () => {
    it('should update a record', async () => {
      const record = { id: '1', name: 'Old' };
      mockRepo.findOne.mockResolvedValue(record);
      mockRepo.save.mockResolvedValue({ ...record, name: 'New' });
      const result = await service.update('1', { name: 'New' });
      expect(result.name).toBe('New');
    });
  });

  // === CRUD: REMOVE ===
  describe('remove', () => {
    it('should remove a record', async () => {
      const record = { id: '1' };
      mockRepo.findOne.mockResolvedValue(record);
      mockRepo.remove.mockResolvedValue(undefined);
      await service.remove('1');
      expect(mockRepo.remove).toHaveBeenCalledWith(record);
    });

    it('should throw NotFoundException if record not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  // === COMPLETE ===
  describe('complete', () => {
    it('should mark a record as completed', async () => {
      const record = { id: '1', status: 'pending', isAttested: false, completedAt: null };
      mockRepo.findOne.mockResolvedValue(record);
      mockRepo.save.mockResolvedValue({ ...record, status: 'completed', isAttested: true, completedAt: expect.any(String) });

      const result = await service.complete('1');
      expect(result.status).toBe('completed');
      expect(result.isAttested).toBe(true);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.complete('999')).rejects.toThrow(NotFoundException);
    });
  });
});
