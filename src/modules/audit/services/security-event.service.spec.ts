import { SecurityEventService } from './security-event.service';
import { NotFoundException } from '@nestjs/common';
import { ForensicSeverity } from '../entities/forensic-severity.enum';
import { SecurityEventCategory } from '../entities/security-event-category.enum';

jest.mock('../entities/security-event-classified.entity');

describe('SecurityEventService', () => {
  let service: SecurityEventService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn() };
    service = new SecurityEventService(mockRepo);
  });

  describe('ingestEvent', () => {
    it('should create and save security event', async () => {
      const created = { id: 'evt-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);
      const result = await service.ingestEvent('firewall', ForensicSeverity.HIGH, SecurityEventCategory.BRUTE_FORCE, { targetResource: '/api/auth', attackerIp: '1.2.3.4', attackSignature: 'SQLi' });
      expect(result).toEqual(created);
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.sourceComponent).toBe('firewall');
      expect(arg.severityLevel).toBe(ForensicSeverity.HIGH);
      expect(arg.category).toBe(SecurityEventCategory.BRUTE_FORCE);
    });

    it('should set eventTimestamp to current date', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 'evt-1' });
      await service.ingestEvent('ids', ForensicSeverity.LOW, SecurityEventCategory.MALWARE, {});
      expect(mockRepo.create.mock.calls[0][0].eventTimestamp).toBeInstanceOf(Date);
    });

    it('should null out optional metadata fields when not provided', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 'evt-2' });
      await service.ingestEvent('ids', ForensicSeverity.LOW, SecurityEventCategory.MALWARE, {});
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.targetResource).toBeNull();
      expect(arg.attackerIp).toBeNull();
      expect(arg.attackSignature).toBeNull();
    });

    it('should extract fields from metadata', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 'evt-3' });
      await service.ingestEvent('siem', ForensicSeverity.CRITICAL, SecurityEventCategory.DATA_EXFILTRATION, {
        targetResource: '/api/tx', attackerIp: '10.0.0.5', attackSignature: 'T1041',
      });
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.targetResource).toBe('/api/tx');
      expect(arg.attackerIp).toBe('10.0.0.5');
      expect(arg.attackSignature).toBe('T1041');
    });
  });

  describe('listEvents', () => {
    it('should return all events when no filter', async () => {
      const events = [{ id: 'evt-1' }];
      mockRepo.find.mockResolvedValue(events);
      expect(await service.listEvents()).toEqual(events);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: {}, order: { eventTimestamp: 'DESC' } });
    });

    it('should filter by category when provided', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.listEvents(SecurityEventCategory.BRUTE_FORCE);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { category: SecurityEventCategory.BRUTE_FORCE }, order: { eventTimestamp: 'DESC' } });
    });

    it('should return empty array when no events', async () => {
      mockRepo.find.mockResolvedValue([]);
      expect(await service.listEvents(SecurityEventCategory.MALWARE)).toEqual([]);
    });
  });

  describe('detectAnomaly', () => {
    it('should return alertId and severity HIGH', async () => {
      const result = await service.detectAnomaly({ sourceComponent: 'ids', anomalyType: 'tampering' } as any);
      expect(result.alertId).toBeTruthy();
      expect(result.severity).toBe(ForensicSeverity.HIGH);
    });
  });

  describe('classifyEvent', () => {
    it('should update and save event with classification', async () => {
      const evt = { id: 'evt-1', classifiedAsIncident: false };
      mockRepo.findOne.mockResolvedValue(evt);
      mockRepo.save.mockResolvedValue(evt);
      const result = await service.classifyEvent('evt-1', { classifiedAsIncident: true, falsePositive: false, remediationAction: 'block_ip', assignedTo: 'analyst-1' } as any);
      expect(result).toEqual(evt);
      expect(evt.classifiedAsIncident).toBe(true);
      expect(evt.remediationAction).toBe('block_ip');
      expect(evt.assignedTo).toBe('analyst-1');
      expect(evt.analyzedAt).toBeInstanceOf(Date);
      expect(mockRepo.save).toHaveBeenCalledWith(evt);
    });

    it('should default falsePositive to false when not provided', async () => {
      const evt = { id: 'evt-2' };
      mockRepo.findOne.mockResolvedValue(evt);
      await service.classifyEvent('evt-2', { classifiedAsIncident: false } as any);
      expect(evt.falsePositive).toBe(false);
    });

    it('should default remediationAction to null when not provided', async () => {
      const evt = { id: 'evt-3' };
      mockRepo.findOne.mockResolvedValue(evt);
      await service.classifyEvent('evt-3', { classifiedAsIncident: true } as any);
      expect(evt.remediationAction).toBeNull();
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.classifyEvent('missing', { classifiedAsIncident: true } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('mapToMitre', () => {
    it('should update attackSignature with techniqueId and save', async () => {
      const evt = { id: 'evt-1', attackSignature: null };
      mockRepo.findOne.mockResolvedValue(evt);
      const result = await service.mapToMitre('evt-1', 'T1041');
      expect(result.eventId).toBe('evt-1');
      expect(result.mitreTechnique).toBe('T1041');
      expect(evt.attackSignature).toBe('T1041');
      expect(mockRepo.save).toHaveBeenCalledWith(evt);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.mapToMitre('missing', 'T1041')).rejects.toThrow(NotFoundException);
    });
  });

  describe('triggerCriticalAlert', () => {
    it('should return alerted=true with email, sms, webhook channels', async () => {
      const result = await service.triggerCriticalAlert('evt-1');
      expect(result.alerted).toBe(true);
      expect(result.channels).toContain('email');
      expect(result.channels).toContain('sms');
      expect(result.channels).toContain('webhook');
    });
  });

  describe('compileEvidencePackage', () => {
    it('should return packageId, totalLogs 0 and compiledAt', async () => {
      const result = await service.compileEvidencePackage(new Date('2026-01-01'), new Date('2026-06-30'), 'GDPR');
      expect(result.packageId).toBeTruthy();
      expect(result.totalLogs).toBe(0);
      expect(result.compiledAt).toBeInstanceOf(Date);
    });
  });

  describe('enforceRetentionPolicy', () => {
    it('should return expiredLogs 0 and retainedLogs 0 by default', async () => {
      const result = await service.enforceRetentionPolicy();
      expect(result.expiredLogs).toBe(0);
      expect(result.retainedLogs).toBe(0);
    });
  });

  describe('triggerPlaybook', () => {
    it('should return brute_force playbook steps', async () => {
      const result = await service.triggerPlaybook(SecurityEventCategory.BRUTE_FORCE);
      expect(result.playbookId).toBeTruthy();
      expect(result.steps).toContain('isolate_source_ip');
      expect(result.steps).toContain('force_password_reset');
      expect(result.steps).toContain('notify_security_team');
    });

    it('should return malware playbook steps', async () => {
      const result = await service.triggerPlaybook(SecurityEventCategory.MALWARE);
      expect(result.steps).toContain('quarantine_host');
      expect(result.steps).toContain('block_c2_domains');
      expect(result.steps).toContain('forensic_image_disk');
    });

    it('should return data_exfiltration playbook steps', async () => {
      const result = await service.triggerPlaybook(SecurityEventCategory.DATA_EXFILTRATION);
      expect(result.steps).toContain('block_egress_traffic');
      expect(result.steps).toContain('identify_data_volume');
      expect(result.steps).toContain('notify_dpo');
    });

    it('should return default triage steps for unknown category', async () => {
      const result = await service.triggerPlaybook('unknown' as any);
      expect(result.steps).toEqual(['triage', 'investigate', 'contain']);
    });
  });
});
