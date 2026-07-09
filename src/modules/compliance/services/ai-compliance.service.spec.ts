import { AiComplianceService } from './ai-compliance.service';

describe('AiComplianceService', () => {
  let service: AiComplianceService;

  beforeEach(() => {
    service = new AiComplianceService();
  });

  // ─── detectAnomalies ─────────────────────────────────────────
  describe('detectAnomalies', () => {
    it('should return empty anomalies when all txs match baseline', async () => {
      const input = {
        transactionHistory: [
          { amount: 100, timestamp: new Date(), counterparty: 'Regular Corp' },
          { amount: 110, timestamp: new Date(), counterparty: 'Regular Corp' },
        ],
        userProfile: {
          avgTransactionAmount: 105,
          typicalCounterparties: ['Regular Corp'],
          transactionFrequency: 'daily',
        },
      };

      const result = await service.detectAnomalies(input);

      expect(result.baselineUpdated).toBe(true);
      expect(result.anomalies).toEqual([]);
    });

    it('should detect amount deviation anomaly', async () => {
      const input = {
        transactionHistory: [
          { amount: 1000, timestamp: new Date(), counterparty: 'Normal' },
        ],
        userProfile: {
          avgTransactionAmount: 100,
          typicalCounterparties: ['Normal'],
          transactionFrequency: 'weekly',
        },
      };

      const result = await service.detectAnomalies(input);

      expect(result.anomalies.some(a => a.type === 'amount_deviation')).toBe(true);
    });

    it('should detect new counterparty anomaly', async () => {
      const input = {
        transactionHistory: [
          { amount: 100, timestamp: new Date(), counterparty: 'Unknown Entity' },
        ],
        userProfile: {
          avgTransactionAmount: 100,
          typicalCounterparties: ['Known Partner'],
          transactionFrequency: 'monthly',
        },
      };

      const result = await service.detectAnomalies(input);

      expect(result.anomalies.some(a => a.type === 'new_counterparty')).toBe(true);
    });

    it('should handle last 10 transactions limit', async () => {
      const txHistory = Array.from({ length: 15 }, (_, i) => ({
        amount: 200,
        timestamp: new Date(Date.now() - i * 60000),
        counterparty: `Party${i}`,
      }));

      const result = await service.detectAnomalies({
        transactionHistory: txHistory,
        userProfile: {
          avgTransactionAmount: 100,
          typicalCounterparties: ['Fixed Partner'],
          transactionFrequency: 'daily',
        },
      });

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.baselineUpdated).toBe(true);
    });

    it('should handle empty transaction history', async () => {
      const result = await service.detectAnomalies({
        transactionHistory: [],
        userProfile: {
          avgTransactionAmount: 100,
          typicalCounterparties: [],
          transactionFrequency: 'unknown',
        },
      });

      expect(result.anomalies).toEqual([]);
      expect(result.baselineUpdated).toBe(true);
    });
  });

  // ─── analyzeMoneyFlow ────────────────────────────────────────
  describe('analyzeMoneyFlow', () => {
    it('should return nodes with CONNECTED suffix', async () => {
      const result = await service.analyzeMoneyFlow(['node1', 'node2'], 2);

      expect(result.nodes).toContain('node1');
      expect(result.nodes).toContain('CONNECTED-node1');
      expect(result.nodes).toContain('node2');
      expect(result.nodes).toContain('CONNECTED-node2');
    });

    it('should create edges between nodes', async () => {
      const result = await service.analyzeMoneyFlow(['a', 'b', 'c', 'd', 'e']);

      expect(result.edges).toBeInstanceOf(Array);
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.edges[0]).toHaveProperty('from');
      expect(result.edges[0]).toHaveProperty('to');
      expect(result.edges[0]).toHaveProperty('amount');
      expect(result.edges[0].amount).toBeGreaterThan(0);
    });

    it('should return cluster count', async () => {
      const result = await service.analyzeMoneyFlow(['node1'], 1);
      expect(result.clusters).toBeGreaterThanOrEqual(0);
    });

    it('should respect default depth of 2', async () => {
      const result1 = await service.analyzeMoneyFlow(['n1']);
      const result2 = await service.analyzeMoneyFlow(['n1'], 2);
      expect(result1.clusters).toBe(result2.clusters);
    });

    it('should handle single node input', async () => {
      const result = await service.analyzeMoneyFlow(['single']);
      expect(result.nodes).toHaveLength(2);
    });
  });

  // ─── continuouslyMonitorRisk ─────────────────────────────────
  describe('continuouslyMonitorRisk', () => {
    it('should return low risk with no triggers', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', []);
      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.updateReasons).toEqual([]);
    });

    it('should calculate risk from transaction triggers', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['transaction']);
      expect(result.riskScore).toBe(10);
      expect(result.riskLevel).toBe('low');
      expect(result.updateReasons).toContain('Recent transaction activity');
    });

    it('should calculate risk from screening triggers', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['screening']);
      expect(result.riskScore).toBe(30);
      expect(result.riskLevel).toBe('medium');
      expect(result.updateReasons).toContain('Screening hit detected');
    });

    it('should calculate risk from profile_change triggers', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['profile_change']);
      expect(result.riskScore).toBe(15);
      expect(result.riskLevel).toBe('low');
      expect(result.updateReasons).toContain('Profile modification detected');
    });

    it('should combine multiple triggers', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['transaction', 'screening', 'profile_change']);
      expect(result.riskScore).toBe(55);
      expect(result.riskLevel).toBe('high');
      expect(result.updateReasons).toHaveLength(3);
    });

    it('should cap score at 100', async () => {
      const triggers: Array<'transaction' | 'screening' | 'profile_change'> = Array(20).fill('screening');
      const result = await service.continuouslyMonitorRisk('user-1', triggers);
      expect(result.riskScore).toBe(100);
      expect(result.riskLevel).toBe('critical');
    });

    it('should return high risk for score 50-69', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['screening', 'profile_change', 'profile_change']);
      expect(result.riskScore).toBe(60);
      expect(result.riskLevel).toBe('high');
    });

    it('should return critical risk for score >= 70', async () => {
      const result = await service.continuouslyMonitorRisk('user-1', ['screening', 'screening', 'screening']);
      expect(result.riskScore).toBe(90);
      expect(result.riskLevel).toBe('critical');
    });
  });
});
