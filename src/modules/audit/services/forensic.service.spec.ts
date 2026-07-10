import { ForensicService } from './forensic.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('../entities/forensic-case.entity');
jest.mock('../entities/forensic-evidence-item.entity');

describe('ForensicService', () => {
  let service: ForensicService;
  let mockCaseRepo: any;
  let mockEvidenceRepo: any;

  beforeEach(() => {
    mockCaseRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
    mockEvidenceRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
    service = new ForensicService(mockCaseRepo, mockEvidenceRepo);
  });

  describe('createCase', () => {
    it('should create case with provided fields', async () => {
      const created = { id: 'case-1' };
      mockCaseRepo.create.mockReturnValue(created);
      mockCaseRepo.save.mockResolvedValue(created);
      const result = await service.createCase({ caseNumber: 'FC-001', title: 'Investigation', severity: 'high' } as any, 'inv-1');
      expect(result).toEqual(created);
      const arg = mockCaseRepo.create.mock.calls[0][0];
      expect(arg.caseNumber).toBe('FC-001');
      expect(arg.startedBy).toBe('inv-1');
    });

    it('should convert estimatedResolution string to Date', async () => {
      mockCaseRepo.create.mockReturnValue({});
      mockCaseRepo.save.mockResolvedValue({});
      await service.createCase({ caseNumber: 'FC-002', title: 'X', severity: 'medium', estimatedResolution: '2026-12-31' } as any, 'inv-1');
      expect(mockCaseRepo.create.mock.calls[0][0].estimatedResolution).toBeInstanceOf(Date);
    });

    it('should null out estimatedResolution when not provided', async () => {
      mockCaseRepo.create.mockReturnValue({});
      mockCaseRepo.save.mockResolvedValue({});
      await service.createCase({ caseNumber: 'FC-003', title: 'X', severity: 'low' } as any, 'inv-1');
      expect(mockCaseRepo.create.mock.calls[0][0].estimatedResolution).toBeNull();
    });

    it('should convert regulatoryDeadline string to Date', async () => {
      mockCaseRepo.create.mockReturnValue({});
      mockCaseRepo.save.mockResolvedValue({});
      await service.createCase({ caseNumber: 'FC-004', title: 'X', severity: 'high', regulatoryDeadline: '2026-09-30' } as any, 'inv-1');
      expect(mockCaseRepo.create.mock.calls[0][0].regulatoryDeadline).toBeInstanceOf(Date);
    });

    it('should default affectedUsers to empty array', async () => {
      mockCaseRepo.create.mockReturnValue({});
      mockCaseRepo.save.mockResolvedValue({});
      await service.createCase({ caseNumber: 'FC-005', title: 'X', severity: 'high' } as any, 'inv-1');
      expect(mockCaseRepo.create.mock.calls[0][0].affectedUsers).toEqual([]);
    });

    it('should null out description when not provided', async () => {
      mockCaseRepo.create.mockReturnValue({});
      mockCaseRepo.save.mockResolvedValue({});
      await service.createCase({ caseNumber: 'FC-006', title: 'X', severity: 'high' } as any, 'inv-1');
      expect(mockCaseRepo.create.mock.calls[0][0].description).toBeNull();
    });
  });

  describe('getCase', () => {
    it('should return case when found', async () => {
      const c = { id: 'case-1', title: 'Found' };
      mockCaseRepo.findOne.mockResolvedValue(c);
      expect(await service.getCase('case-1')).toEqual(c);
    });

    it('should throw NotFoundException when not found', async () => {
      mockCaseRepo.findOne.mockResolvedValue(null);
      await expect(service.getCase('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listCases', () => {
    it('should return all cases when no filter', async () => {
      const cases = [{ id: 'case-1' }];
      mockCaseRepo.find.mockResolvedValue(cases);
      expect(await service.listCases()).toEqual(cases);
      expect(mockCaseRepo.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
    });

    it('should filter by status when provided', async () => {
      mockCaseRepo.find.mockResolvedValue([]);
      await service.listCases('open' as any);
      expect(mockCaseRepo.find).toHaveBeenCalledWith({ where: { status: 'open' }, order: { createdAt: 'DESC' } });
    });
  });

  describe('uploadEvidence', () => {
    it('should create evidence and increment case evidenceCount', async () => {
      const c = { id: 'case-1', evidenceCount: 0 };
      mockCaseRepo.findOne.mockResolvedValue(c);
      const ev = { id: 'ev-1' };
      mockEvidenceRepo.create.mockReturnValue(ev);
      mockEvidenceRepo.save.mockResolvedValue(ev);
      const result = await service.uploadEvidence('case-1', {
        itemType: 'logfile', sourceSystem: 'auth', collectedFrom: '/var/log', collectionMethod: 'ssh', fileHashMd5: 'md5', fileHashSha256: 'sha',
      } as any, 'col-1');
      expect(result).toEqual(ev);
      expect(c.evidenceCount).toBe(1);
      expect(mockCaseRepo.save).toHaveBeenCalledWith(c);
    });

    it('should create chainCustodyRecord with collected entry', async () => {
      const c = { id: 'case-1', evidenceCount: 0 };
      mockCaseRepo.findOne.mockResolvedValue(c);
      mockEvidenceRepo.create.mockReturnValue({});
      mockEvidenceRepo.save.mockResolvedValue({ id: 'ev-1' });
      await service.uploadEvidence('case-1', {
        itemType: 'logfile', sourceSystem: 'auth', collectedFrom: '/path', collectionMethod: 'copy', fileHashMd5: 'm', fileHashSha256: 's',
      } as any, 'col-1');
      const arg = mockEvidenceRepo.create.mock.calls[0][0];
      expect(arg.chainCustodyRecord.entries[0].action).toBe('collected');
      expect(arg.chainCustodyRecord.entries[0].actor).toBe('col-1');
      expect(arg.verified).toBe(false);
    });

    it('should include collectorId in accessGrantedTo', async () => {
      const c = { id: 'case-1', evidenceCount: 0 };
      mockCaseRepo.findOne.mockResolvedValue(c);
      mockEvidenceRepo.create.mockReturnValue({});
      mockEvidenceRepo.save.mockResolvedValue({ id: 'ev-1' });
      await service.uploadEvidence('case-1', {
        itemType: 'disk', sourceSystem: 'host', collectedFrom: '/dev/sda', collectionMethod: 'dd', fileHashMd5: 'm', fileHashSha256: 's',
      } as any, 'col-99');
      expect(mockEvidenceRepo.create.mock.calls[0][0].accessGrantedTo).toContain('col-99');
    });

    it('should throw NotFoundException when case does not exist', async () => {
      mockCaseRepo.findOne.mockResolvedValue(null);
      await expect(service.uploadEvidence('missing', {
        itemType: 'x', sourceSystem: 'x', collectedFrom: 'x', collectionMethod: 'x', fileHashMd5: 'x', fileHashSha256: 'x',
      } as any, 'col-1')).rejects.toThrow(NotFoundException);
    });

    it('should convert retentionUntil string to Date', async () => {
      const c = { id: 'case-1', evidenceCount: 0 };
      mockCaseRepo.findOne.mockResolvedValue(c);
      mockEvidenceRepo.create.mockReturnValue({});
      mockEvidenceRepo.save.mockResolvedValue({ id: 'ev-1' });
      await service.uploadEvidence('case-1', {
        itemType: 'x', sourceSystem: 'x', collectedFrom: 'x', collectionMethod: 'x', fileHashMd5: 'x', fileHashSha256: 'x', retentionUntil: '2036-01-01',
      } as any, 'col-1');
      expect(mockEvidenceRepo.create.mock.calls[0][0].retentionUntil).toBeInstanceOf(Date);
    });
  });

  describe('verifyEvidence', () => {
    it('should set verified to true and save', async () => {
      const ev = { id: 'ev-1', verified: false };
      mockEvidenceRepo.findOne.mockResolvedValue(ev);
      const result = await service.verifyEvidence('ev-1');
      expect(result.verified).toBe(true);
      expect(result.md5Match).toBe(true);
      expect(result.sha256Match).toBe(true);
      expect(ev.verified).toBe(true);
      expect(mockEvidenceRepo.save).toHaveBeenCalledWith(ev);
    });

    it('should throw NotFoundException when evidence not found', async () => {
      mockEvidenceRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyEvidence('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('buildTimeline', () => {
    it('should return timeline ordered by collectedAt ASC', async () => {
      mockEvidenceRepo.find.mockResolvedValue([
        { id: 'ev-1', collectedAt: new Date('2026-01-01'), itemType: 'logfile', sourceSystem: 'auth' },
        { id: 'ev-2', collectedAt: new Date('2026-01-02'), itemType: 'disk', sourceSystem: 'host' },
      ]);
      const result = await service.buildTimeline('case-1');
      expect(result.timeline).toHaveLength(2);
      expect(result.timeline[0].event).toContain('logfile');
      expect(result.timeline[1].event).toContain('disk');
    });

    it('should return empty timeline when no evidence', async () => {
      mockEvidenceRepo.find.mockResolvedValue([]);
      expect((await service.buildTimeline('case-1')).timeline).toEqual([]);
    });

    it('should use unknown when sourceSystem is null', async () => {
      mockEvidenceRepo.find.mockResolvedValue([{ id: 'ev-1', collectedAt: new Date(), itemType: 'logfile', sourceSystem: null }]);
      const result = await service.buildTimeline('case-1');
      expect(result.timeline[0].source).toBe('unknown');
    });
  });

  describe('generateReport', () => {
    it('should return reportId and set reportGeneratedAt on case', async () => {
      const c = { id: 'case-1', caseNumber: 'FC-001' };
      mockCaseRepo.findOne.mockResolvedValue(c);
      const result = await service.generateReport({ caseId: 'case-1' } as any);
      expect(result.reportId).toHaveLength(64);
      expect(result.caseId).toBe('case-1');
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(c.reportGeneratedAt).toBeInstanceOf(Date);
      expect(mockCaseRepo.save).toHaveBeenCalledWith(c);
    });

    it('should throw NotFoundException when case not found', async () => {
      mockCaseRepo.findOne.mockResolvedValue(null);
      await expect(service.generateReport({ caseId: 'missing' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('identifyInitialAccess', () => {
    it('should return first timeline entry as access point', async () => {
      mockEvidenceRepo.find.mockResolvedValue([
        { id: 'ev-1', collectedAt: new Date('2026-01-01'), itemType: 'log', sourceSystem: 'auth' },
        { id: 'ev-2', collectedAt: new Date('2026-01-02'), itemType: 'pcap', sourceSystem: 'net' },
      ]);
      const result = await service.identifyInitialAccess('case-1');
      expect(result.accessPoint).toBe('auth');
      expect(result.earliestEvent).toBeInstanceOf(Date);
    });

    it('should return null when no evidence', async () => {
      mockEvidenceRepo.find.mockResolvedValue([]);
      const result = await service.identifyInitialAccess('case-1');
      expect(result.accessPoint).toBeNull();
      expect(result.earliestEvent).toBeNull();
    });
  });

  describe('detectLateralMovement', () => {
    it('should detect lateral movement when >1 sourceSystem', async () => {
      mockEvidenceRepo.find.mockResolvedValue([{ id: 'ev-1', sourceSystem: 'auth' }, { id: 'ev-2', sourceSystem: 'db' }]);
      const result = await service.detectLateralMovement('case-1');
      expect(result.detected).toBe(true);
      expect(result.affectedSystems).toHaveLength(2);
    });

    it('should return detected=false when only 1 sourceSystem', async () => {
      mockEvidenceRepo.find.mockResolvedValue([{ id: 'ev-1', sourceSystem: 'auth' }, { id: 'ev-2', sourceSystem: 'auth' }]);
      const result = await service.detectLateralMovement('case-1');
      expect(result.detected).toBe(false);
      expect(result.affectedSystems).toEqual(['auth']);
    });

    it('should return detected=false when no evidence', async () => {
      mockEvidenceRepo.find.mockResolvedValue([]);
      const result = await service.detectLateralMovement('case-1');
      expect(result.detected).toBe(false);
      expect(result.affectedSystems).toEqual([]);
    });
  });

  describe('reconstructSession', () => {
    it('should return evidence ids as events', async () => {
      mockEvidenceRepo.find.mockResolvedValue([{ id: 'ev-1' }, { id: 'ev-2' }]);
      const result = await service.reconstructSession('case-1');
      expect(result.sessionId).toBeNull();
      expect(result.events).toEqual(['ev-1', 'ev-2']);
    });

    it('should return empty events when no evidence', async () => {
      mockEvidenceRepo.find.mockResolvedValue([]);
      expect((await service.reconstructSession('case-1')).events).toEqual([]);
    });
  });

  describe('detectPrivilegeEscalation', () => {
    it('should return detected=false and empty indicators by default', async () => {
      const result = await service.detectPrivilegeEscalation('case-1');
      expect(result.detected).toBe(false);
      expect(result.indicators).toEqual([]);
    });
  });

  describe('detectDataExfiltration', () => {
    it('should return detected=false and volumeMb=0 by default', async () => {
      const result = await service.detectDataExfiltration('case-1');
      expect(result.detected).toBe(false);
      expect(result.volumeMb).toBe(0);
    });
  });
});
