import { Injectable } from '@nestjs/common';

interface ScreeningResult {
  screened: boolean;
  matchesFound: number;
  riskScore: number;
  requiresManualReview: boolean;
  matchedEntities?: Array<{
    name: string;
    matchPercentage: number;
    listName: string;
    entityType: string;
  }>;
  cleared: boolean;
}

const sanctionsListsStore = {
  OFAC: ['ListedEntity1', 'BlockedOrganization'],
  UN: ['SanctionedParty', 'RestrictedGroup'],
  EU: ['DesignatedPerson', 'ProhibitedEntity'],
};

@Injectable()
export class SanctionsScreeningService {
  async screenBeneficiary(name: string, country?: string): Promise<ScreeningResult> {
    const allMatches: Array<{ name: string; matchPercentage: number; listName: string; entityType: string }> = [];

    for (const [listName, entities] of Object.entries(sanctionsListsStore)) {
      for (const entity of entities) {
        const similarity = this.calculateSimilarity(name.toLowerCase(), entity.toLowerCase());
        if (similarity >= 85) {
          allMatches.push({
            name: entity,
            matchPercentage: similarity,
            listName,
            entityType: 'individual',
          });
        }
      }
    }

    return {
      screened: true,
      matchesFound: allMatches.length,
      riskScore: allMatches.length > 0 ? Math.max(...allMatches.map(m => m.matchPercentage)) : 0,
      requiresManualReview: allMatches.length > 0 && allMatches.some(m => m.matchPercentage < 95),
      matchedEntities: allMatches.length > 0 ? allMatches : undefined,
      cleared: allMatches.length === 0,
    };
  }

  async screenPayment(instruction: {
    beneficiaryName: string;
    intermediaryBank?: string;
    originatorName?: string;
  }): Promise<ScreeningResult> {
    const results = [];

    results.push(await this.screenBeneficiary(instruction.beneficiaryName));
    
    if (instruction.intermediaryBank) {
      results.push(await this.screenBeneficiary(instruction.intermediaryBank));
    }

    if (instruction.originatorName) {
      results.push(await this.screenBeneficiary(instruction.originatorName));
    }

    const totalMatches = results.reduce((sum, r) => sum + r.matchesFound, 0);
    const maxRiskScore = Math.max(...results.map(r => r.riskScore), 0);

    return {
      screened: true,
      matchesFound: totalMatches,
      riskScore: maxRiskScore,
      requiresManualReview: results.some(r => r.requiresManualReview),
      cleared: totalMatches === 0,
    };
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 100;
    if (a.length === 0 || b.length === 0) return 0;
    
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length - shorter.length > 3) return 0;
    
    const ratio = (1 - (longer.length - shorter.length) / longer.length) * 100;
    return Math.round(ratio);
  }

  async preserveEvidence(paymentId: string, screeningResult: ScreeningResult): Promise<void> {
  }

  async adjudicateFalsePositive(matchId: string, justification: string, adjudicatorId: string): Promise<void> {
  }
}
