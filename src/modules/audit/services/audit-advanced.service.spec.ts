import { AuditAdvancedService } from './audit-advanced.service';

jest.mock('../entities/audit-log.entity');

describe('AuditAdvancedService', () => {
  let service: AuditAdvancedService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { findOne: jest.fn(), find: jest.fn(), count: jest.fn() };
    service = new AuditAdvancedService(mockRepo);
  });

  describe('computeChainHash', () => {
    it('should return SHA-256 hash when log found', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'log-1', eventType: 'login', createdAt: new Date('2026-01-01T00:00:00Z') });
      const result = await service.computeChainHash('log-1', 'prev-hash-123');
      expect(result).toHaveLength(64);
    });

    it('should return empty string when log not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.computeChainHash('missing', 'prev-hash');
      expect(result).toBe('');
    });

    it('should handle null previousHash', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'log-1', eventType: 'login', createdAt: new Date('2026-01-01T00:00:00Z') });
      const result = await service.computeChainHash('log-1', null);
      expect(result).toHaveLength(64);
    });

    it('should produce different hashes for different previousHash values', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'log-1', eventType: 'login', createdAt: new Date('2026-01-01T00:00:00Z') });
      const h1 = await service.computeChainHash('log-1', 'hash-a');
      const h2 = await service.computeChainHash('log-1', 'hash-b');
      expect(h1).not.toBe(h2);
    });
  });

  describe('anchorToBlockchain', () => {
    it('should return anchored=true with blockHash and txId', async () => {
      const result = await service.anchorToBlockchain(['log-1', 'log-2']);
      expect(result.anchored).toBe(true);
      expect(result.blockHash).toHaveLength(64);
      expect(result.txId).toBeTruthy();
    });

    it('should produce different blockHash for different batches', async () => {
      const r1 = await service.anchorToBlockchain(['log-1']);
      const r2 = await service.anchorToBlockchain(['log-2']);
      expect(r1.blockHash).not.toBe(r2.blockHash);
    });
  });

  describe('bulkExport', () => {
    it('should return exportId, logCount and format', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'log-1' }, { id: 'log-2' }]);
      const result = await service.bulkExport({ logIds: ['log-1', 'log-2'], format: 'pdf-a' } as any);
      expect(result.logCount).toBe(2);
      expect(result.exportId).toHaveLength(64);
      expect(result.format).toBe('pdf-a');
    });

    it('should default format to pdf-a when not provided', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.bulkExport({ logIds: [] } as any);
      expect(result.format).toBe('pdf-a');
    });

    it('should return logCount 0 when no logs found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.bulkExport({ logIds: ['missing'] } as any);
      expect(result.logCount).toBe(0);
    });
  });

  describe('sealBlock', () => {
    it('should return sealed=true with blockHash', async () => {
      const result = await service.sealBlock(['log-1', 'log-2']);
      expect(result.sealed).toBe(true);
      expect(result.blockHash).toHaveLength(64);
    });

    it('should produce different blockHash for different log sets', async () => {
      const r1 = await service.sealBlock(['log-1', 'log-2']);
      const r2 = await service.sealBlock(['log-3', 'log-4']);
      expect(r1.blockHash).not.toBe(r2.blockHash);
    });
  });

  describe('correlateAcrossSystems', () => {
    it('should return correlated events and systems involved', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'log-1', httpPath: '/api/auth/login' },
        { id: 'log-2', httpPath: '/api/chat/send' },
      ]);
      const result = await service.correlateAcrossSystems('req-1');
      expect(result.correlatedEvents).toHaveLength(2);
      expect(result.systemsInvolved).toContain('api');
    });

    it('should return empty arrays when no events found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.correlateAcrossSystems('req-none');
      expect(result.correlatedEvents).toEqual([]);
      expect(result.systemsInvolved).toEqual([]);
    });

    it('should handle events with null httpPath', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'log-1', httpPath: null }]);
      const result = await service.correlateAcrossSystems('req-1');
      expect(result.systemsInvolved).toEqual([]);
    });
  });

  describe('detectWriteAnomaly', () => {
    it('should return no anomalies by default', async () => {
      const result = await service.detectWriteAnomaly();
      expect(result.anomalies).toEqual([]);
      expect(result.severity).toBe('none');
    });
  });

  describe('enrichGeoIp', () => {
    it('should return null geo data by default', async () => {
      const result = await service.enrichGeoIp('192.168.1.1');
      expect(result.country).toBeNull();
      expect(result.city).toBeNull();
      expect(result.lat).toBeNull();
      expect(result.lon).toBeNull();
    });
  });

  describe('getComplianceDashboard', () => {
    it('should return SOX, GDPR, PCI sections with ready status', async () => {
      mockRepo.count.mockResolvedValue(42);
      const result = await service.getComplianceDashboard();
      expect(result.sox.status).toBe('ready');
      expect(result.gdpr.status).toBe('ready');
      expect(result.pci.status).toBe('ready');
    });

    it('should include totalEvents in SOX section', async () => {
      mockRepo.count.mockResolvedValue(100);
      const result = await service.getComplianceDashboard();
      expect(result.sox.totalEvents).toBe(100);
    });
  });

  describe('collectComplianceEvidence', () => {
    it('should return evidenceCount 0 and empty artifacts by default', async () => {
      const result = await service.collectComplianceEvidence(
        { start: new Date('2026-01-01'), end: new Date('2026-06-30') }, 'SOX',
      );
      expect(result.evidenceCount).toBe(0);
      expect(result.artifactIds).toEqual([]);
    });
  });

  describe('monitorSecurityControls', () => {
    it('should return healthy controls by default', async () => {
      const result = await service.monitorSecurityControls();
      expect(result.healthy).toBe(true);
      expect(result.controls.length).toBeGreaterThan(0);
    });

    it('should include firewall control with healthy status', async () => {
      const result = await service.monitorSecurityControls();
      expect(result.controls.find(c => c.name === 'firewall')).toBeDefined();
      expect(result.controls.find(c => c.name === 'firewall').status).toBe('healthy');
    });
  });
});
