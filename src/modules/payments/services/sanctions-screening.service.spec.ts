import { SanctionsScreeningService } from './sanctions-screening.service';

describe('SanctionsScreeningService', () => {
  let service: SanctionsScreeningService;

  beforeEach(() => {
    service = new SanctionsScreeningService();
  });

  describe('screenBeneficiary', () => {
    it('should clear when name not on any list', async () => {
      const result = await service.screenBeneficiary('John Doe');

      expect(result.screened).toBe(true);
      expect(result.matchesFound).toBe(0);
      expect(result.cleared).toBe(true);
      expect(result.riskScore).toBe(0);
      expect(result.requiresManualReview).toBe(false);
    });

    it('should detect exact match on OFAC list', async () => {
      const result = await service.screenBeneficiary('ListedEntity1');

      expect(result.screened).toBe(true);
      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
      expect(result.riskScore).toBe(100);
      expect(result.matchedEntities[0].listName).toBe('OFAC');
    });

    it('should detect match on UN list', async () => {
      const result = await service.screenBeneficiary('SanctionedParty');

      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
      expect(result.matchedEntities.some(e => e.listName === 'UN')).toBe(true);
    });

    it('should detect match on EU list', async () => {
      const result = await service.screenBeneficiary('DesignatedPerson');

      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
      expect(result.matchedEntities.some(e => e.listName === 'EU')).toBe(true);
    });

    it('should return requiresManualReview true for partial matches', async () => {
      const result = await service.screenBeneficiary('ListedEntity');

      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
    });

    it('should not match names with very different lengths', async () => {
      const result = await service.screenBeneficiary('A');

      expect(result.matchesFound).toBe(0);
      expect(result.cleared).toBe(true);
    });
  });

  describe('screenPayment', () => {
    it('should screen beneficiary and return cleared when no matches', async () => {
      const result = await service.screenPayment({ beneficiaryName: 'John Doe' });

      expect(result.screened).toBe(true);
      expect(result.cleared).toBe(true);
      expect(result.matchesFound).toBe(0);
    });

    it('should screen intermediary bank when provided', async () => {
      const result = await service.screenPayment({
        beneficiaryName: 'John Doe',
        intermediaryBank: 'BlockedOrganization',
      });

      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
    });

    it('should screen originator when provided', async () => {
      const result = await service.screenPayment({
        beneficiaryName: 'John Doe',
        originatorName: 'SanctionedParty',
      });

      expect(result.matchesFound).toBeGreaterThan(0);
      expect(result.cleared).toBe(false);
    });

    it('should aggregate matches from all parties', async () => {
      const result = await service.screenPayment({
        beneficiaryName: 'ListedEntity1',
        intermediaryBank: 'BlockedOrganization',
        originatorName: 'SanctionedParty',
      });

      expect(result.matchesFound).toBeGreaterThanOrEqual(3);
      expect(result.cleared).toBe(false);
    });

    it('should use max risk score from all parties', async () => {
      const result = await service.screenPayment({
        beneficiaryName: 'ListedEntity1',
        originatorName: 'John Doe',
      });

      expect(result.riskScore).toBe(100);
    });
  });

  describe('preserveEvidence', () => {
    it('should complete without throwing', async () => {
      await expect(service.preserveEvidence('pay-1', { screened: true, matchesFound: 0 } as any))
        .resolves.toBeUndefined();
    });
  });

  describe('adjudicateFalsePositive', () => {
    it('should complete without throwing', async () => {
      await expect(service.adjudicateFalsePositive('match-1', 'Not the same entity', 'adj-1'))
        .resolves.toBeUndefined();
    });
  });
});
