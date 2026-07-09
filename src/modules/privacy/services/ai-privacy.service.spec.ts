import { AiPrivacyService } from './ai-privacy.service';

describe('AiPrivacyService', () => {
  let service: AiPrivacyService;

  beforeEach(() => {
    service = new AiPrivacyService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assessPrivacyRisk', () => {
    it('should return low risk for minimal input', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['email'],
        purposes: ['service_delivery'],
        dataSubjects: ['users'],
      });
      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.modelVersion).toBe('mock-v1.0');
      expect(result.disclaimer).toBeTruthy();
    });

    it('should detect sensitive data types and increase score', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['biometric', 'health_data'],
        purposes: ['research'],
        dataSubjects: ['patients'],
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.factors.some(f => f.includes('biometric'))).toBe(true);
      expect(result.factors.some(f => f.includes('health_data'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('DPIA'))).toBe(true);
    });

    it('should detect high-risk transfer countries', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['email'],
        purposes: ['service_delivery'],
        dataSubjects: ['users'],
        transferCountries: ['CN', 'RU'],
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
      expect(result.factors.some(f => f.includes('países de alto riesgo'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('SCC'))).toBe(true);
    });

    it('should penalize multiple purposes (>3)', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['email'],
        purposes: ['a', 'b', 'c', 'd'],
        dataSubjects: ['users'],
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(15);
      expect(result.factors.some(f => f.includes('Múltiples propósitos'))).toBe(true);
    });

    it('should penalize long retention period (>5 years)', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['email'],
        purposes: ['billing'],
        dataSubjects: ['users'],
        retentionPeriod: '10 years',
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
      expect(result.factors.some(f => f.includes('Retención prolongada'))).toBe(true);
    });

    it('should return critical risk level when score >= 70', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['biometric', 'health_data', 'financial'],
        purposes: ['a', 'b', 'c', 'd'],
        dataSubjects: ['patients'],
        transferCountries: ['CN', 'RU'],
        retentionPeriod: '10 years',
      });
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.riskLevel).toBe('critical');
    });

    it('should return generic recommendation when no risks found', async () => {
      const result = await service.assessPrivacyRisk({
        processDataTypes: ['email'],
        purposes: ['billing'],
        dataSubjects: ['users'],
      });
      expect(result.recommendations.some(r => r.includes('No se identificaron riesgos'))).toBe(true);
    });
  });

  describe('autoResolveDsar', () => {
    it('should detect erasure from keywords', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Quiero borrar todos mis datos',
        userId: 'u1',
      });
      expect(result.detectedType).toBe('erasure');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should detect portability from keywords', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Solicito la portabilidad de mis datos',
        userId: 'u1',
      });
      expect(result.detectedType).toBe('portability');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect rectification from keywords', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Necesito corregir mi información inexacta',
        userId: 'u1',
      });
      expect(result.detectedType).toBe('rectification');
      expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it('should detect objection from keywords', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Me opongo al uso de mis datos para marketing',
        userId: 'u1',
      });
      expect(result.detectedType).toBe('objection');
    });

    it('should default to access when no keywords match', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Hola, tengo una pregunta genérica',
        userId: 'u1',
      });
      expect(result.detectedType).toBe('access');
      expect(result.confidence).toBe(0.5);
    });

    it('should extract email and phone from request text', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Mi correo es test@example.com y mi teléfono +525512345678',
        userId: 'u1',
      });
      expect(result.extractedFields.email).toBe('test@example.com');
      expect(result.extractedFields.phone).toBe('+525512345678');
    });

    it('should include disclaimer and model version', async () => {
      const result = await service.autoResolveDsar({
        requestText: 'Quiero acceder a mis datos',
        userId: 'u1',
      });
      expect(result.modelVersion).toBe('nlp-mock-v1.0');
      expect(result.disclaimer).toBeTruthy();
    });
  });

  describe('getDataFlowMap', () => {
    it('should return flows with summary', async () => {
      const result = await service.getDataFlowMap();
      expect(result.flows.length).toBeGreaterThan(0);
      expect(result.summary.totalFlows).toBe(result.flows.length);
      expect(result.summary.compliant + result.summary.warnings + result.summary.nonCompliant).toBe(result.summary.totalFlows);
    });

    it('should include at least one non-compliant flow', async () => {
      const result = await service.getDataFlowMap();
      expect(result.summary.nonCompliant).toBeGreaterThanOrEqual(1);
      expect(result.flows.some(f => f.complianceStatus === 'non_compliant')).toBe(true);
    });

    it('should include at least one warning flow', async () => {
      const result = await service.getDataFlowMap();
      expect(result.summary.warnings).toBeGreaterThanOrEqual(1);
      expect(result.flows.some(f => f.complianceStatus === 'warning')).toBe(true);
    });

    it('should include model version and disclaimer', async () => {
      const result = await service.getDataFlowMap();
      expect(result.modelVersion).toBe('flow-mock-v1.0');
      expect(result.disclaimer).toBeTruthy();
    });

    it('should have each flow with required fields', async () => {
      const result = await service.getDataFlowMap();
      for (const flow of result.flows) {
        expect(flow.source).toBeDefined();
        expect(flow.destination).toBeDefined();
        expect(flow.dataType).toBeDefined();
        expect(flow.lawfulBasis).toBeDefined();
        expect(['compliant', 'warning', 'non_compliant']).toContain(flow.complianceStatus);
        expect(flow.notes).toBeDefined();
      }
    });
  });
});
