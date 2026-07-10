import { MlModelService } from './ml-model.service';

describe('MlModelService', () => {
  let service: MlModelService;

  beforeEach(() => {
    service = new MlModelService();
  });

  describe('getPerformance', () => {
    it('should return 3 models', async () => {
      const result = await service.getPerformance();
      expect(result).toHaveLength(3);
    });

    it('should include journal-suggester model', async () => {
      const result = await service.getPerformance();
      expect(result.find(m => m.modelName === 'journal-suggester')).toBeDefined();
    });

    it('should include anomaly-detector model', async () => {
      const result = await service.getPerformance();
      expect(result.find(m => m.modelName === 'anomaly-detector')).toBeDefined();
    });

    it('should include cashflow-classifier model', async () => {
      const result = await service.getPerformance();
      expect(result.find(m => m.modelName === 'cashflow-classifier')).toBeDefined();
    });

    it('should have cashflow-classifier with driftDetected=true', async () => {
      const result = await service.getPerformance();
      expect(result.find(m => m.modelName === 'cashflow-classifier').driftDetected).toBe(true);
    });
  });

  describe('retrain', () => {
    it('should reset driftDetected and bump version', async () => {
      const result = await service.retrain('cashflow-classifier');
      expect(result.driftDetected).toBe(false);
      expect(result.version).toBe('1.0.6'); // 1.0.5 → 1.0.6
      expect(result.predictionsCount).toBe(0);
    });

    it('should update lastTrainedAt', async () => {
      const before = new Date();
      const result = await service.retrain('journal-suggester');
      expect(result.lastTrainedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should return null for unknown model', async () => {
      const result = await service.retrain('unknown-model');
      expect(result).toBeNull();
    });

    it('should bump patch version correctly', async () => {
      const result = await service.retrain('anomaly-detector');
      expect(result.version).toBe('2.0.2'); // 2.0.1 → 2.0.2
    });
  });

  describe('recordPrediction', () => {
    it('should increment predictionsCount for known model', async () => {
      await service.recordPrediction('journal-suggester');
      await service.recordPrediction('journal-suggester');
      const models = await service.getPerformance();
      expect(models.find(m => m.modelName === 'journal-suggester').predictionsCount).toBe(2);
    });

    it('should not throw for unknown model', async () => {
      await expect(service.recordPrediction('unknown')).resolves.toBeUndefined();
    });
  });

  describe('explainPrediction', () => {
    it('should include amount factor when provided', async () => {
      const result = await service.explainPrediction('journal-suggester', { amount: 5000 });
      expect(result.contributingFactors).toContain('Amount: 5000');
    });

    it('should include vendor factor when provided', async () => {
      const result = await service.explainPrediction('journal-suggester', { vendor: 'Acme Corp' });
      expect(result.contributingFactors).toContain('Vendor match: Acme Corp');
    });

    it('should include historical pattern factor when true', async () => {
      const result = await service.explainPrediction('journal-suggester', { historicalPattern: true });
      expect(result.contributingFactors).toContain('Historical pattern alignment');
    });

    it('should return rationale with model name and factor count', async () => {
      const result = await service.explainPrediction('anomaly-detector', { amount: 100, vendor: 'X' });
      expect(result.rationale).toContain('anomaly-detector');
      expect(result.rationale).toContain('2');
    });

    it('should return empty factors when none provided', async () => {
      const result = await service.explainPrediction('journal-suggester', {});
      expect(result.contributingFactors).toEqual([]);
      expect(result.rationale).toContain('0');
    });
  });
});
