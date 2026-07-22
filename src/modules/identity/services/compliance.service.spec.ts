import { ComplianceService } from './compliance.service';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // getGdprConsentStatus
  // ═══════════════════════════════════════════════════
  describe('getGdprConsentStatus', () => {
    it('should return no consent by default', async () => {
      const result = await service.getGdprConsentStatus('u1');
      expect(result.hasConsent).toBe(false);
      expect(result.grantedAt).toBeNull();
      expect(result.purposes).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // getCcpaDisclosure
  // ═══════════════════════════════════════════════════
  describe('getCcpaDisclosure', () => {
    it('should return disclosure text and lastUpdated', async () => {
      const before = new Date();
      const result = await service.getCcpaDisclosure();
      const after = new Date();

      expect(result.disclosureText).toContain('CCPA');
      expect(result.disclosureText).toContain('right to know');
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ═══════════════════════════════════════════════════
  // collectSoc2Artifacts
  // ═══════════════════════════════════════════════════
  describe('collectSoc2Artifacts', () => {
    it('should return artifacts list and completeness score', async () => {
      const period = {
        start: new Date('2026-01-01'),
        end: new Date('2026-06-30'),
      };

      const result = await service.collectSoc2Artifacts(period);
      expect(result.artifacts).toEqual(['access-logs', 'change-records', 'incident-reports']);
      expect(result.completeness).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // getIso27001Checklist
  // ═══════════════════════════════════════════════════
  describe('getIso27001Checklist', () => {
    it('should return checklist with controls, totalControls, and implemented', async () => {
      const result = await service.getIso27001Checklist();
      expect(result.totalControls).toBe(114);
      expect(result.implemented).toBe(85);
      expect(result.controls).toHaveLength(3);
      expect(result.controls[0]).toEqual({
        id: 'A.5.1',
        name: 'Information Security Policies',
        status: 'implemented',
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // scanPciDssRequirements
  // ═══════════════════════════════════════════════════
  describe('scanPciDssRequirements', () => {
    it('should return requirements list and overallScore', async () => {
      const result = await service.scanPciDssRequirements();
      expect(result.overallScore).toBe(75);
      expect(result.requirements).toHaveLength(3);

      const firewall = result.requirements.find(r => r.id === '1');
      expect(firewall).toEqual({
        id: '1',
        title: 'Firewall Configuration',
        compliant: true,
      });

      const storedData = result.requirements.find(r => r.id === '3');
      expect(storedData?.compliant).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // generateComplianceReport
  // ═══════════════════════════════════════════════════
  describe('generateComplianceReport', () => {
    it('should return report with framework, period, and status', async () => {
      const period = {
        start: new Date('2026-01-01'),
        end: new Date('2026-12-31'),
      };

      const result = await service.generateComplianceReport('SOC2', period);
      expect(result.framework).toBe('SOC2');
      expect(result.period).toEqual(period);
      expect(result.status).toBe('generated');
    });

    it('should work with different frameworks', async () => {
      const period = { start: new Date(), end: new Date() };

      const gdpr = await service.generateComplianceReport('GDPR', period);
      expect(gdpr.framework).toBe('GDPR');

      const iso = await service.generateComplianceReport('ISO27001', period);
      expect(iso.framework).toBe('ISO27001');
    });
  });
});
