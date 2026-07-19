import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnderwritingAssessment, UnderwritingDecision } from '../entities/underwriting-assessment.entity';
import { InsuranceQuote } from '../entities/insurance-quote.entity';

@Injectable()
export class UnderwritingService {
  constructor(
    @InjectRepository(UnderwritingAssessment)
    private assessmentRepo: Repository<UnderwritingAssessment>,
    @InjectRepository(InsuranceQuote)
    private quoteRepo: Repository<InsuranceQuote>,
  ) {}

  async evaluate(dto: {
    quoteId?: string;
    policyId?: string;
    riskData: Record<string, any>;
    assessedBy: string;
  }): Promise<UnderwritingAssessment> {
    const riskScore = this.scoreRisk(dto.riskData);
    const riskFactors = this.extractRiskFactors(dto.riskData);
    const recommendedDecision = this.recommendDecision(riskScore);

    const assessment = this.assessmentRepo.create({
      quoteId: dto.quoteId || null,
      policyId: dto.policyId || null,
      riskScore,
      riskFactors,
      recommendedDecision,
      finalDecision: null,
      assessedBy: dto.assessedBy,
      notes: null,
    });

    return this.assessmentRepo.save(assessment);
  }

  async makeDecision(assessmentId: string, decision: UnderwritingDecision, notes?: string): Promise<UnderwritingAssessment> {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    assessment.finalDecision = decision;
    assessment.notes = notes || null;
    return this.assessmentRepo.save(assessment);
  }

  async findByQuote(quoteId: string): Promise<UnderwritingAssessment[]> {
    return this.assessmentRepo.find({ where: { quoteId }, order: { createdAt: 'DESC' } });
  }

  async findByPolicy(policyId: string): Promise<UnderwritingAssessment[]> {
    return this.assessmentRepo.find({ where: { policyId }, order: { createdAt: 'DESC' } });
  }

  private scoreRisk(riskData: Record<string, any>): number {
    let score = 30;
    if (riskData.age) {
      if (riskData.age < 25) score += 35;
      else if (riskData.age > 65) score += 25;
    }
    if (riskData.claimHistory) score += Math.min(riskData.claimHistory * 20, 40);
    if (riskData.smoker) score += 15;
    if (riskData.occupation === 'high_risk') score += 20;
    if (riskData.medicalHistory && riskData.medicalHistory.includes('chronic')) score += 25;
    return Math.min(Math.max(score, 1), 100);
  }

  private extractRiskFactors(riskData: Record<string, any>): Record<string, any> {
    const factors: Record<string, any> = {};
    if (riskData.age) factors.age = riskData.age;
    if (riskData.claimHistory) factors.claimHistory = riskData.claimHistory;
    if (riskData.smoker) factors.smoker = riskData.smoker;
    if (riskData.occupation) factors.occupation = riskData.occupation;
    if (riskData.medicalHistory) factors.medicalHistory = riskData.medicalHistory;
    if (riskData.location) factors.location = riskData.location;
    return factors;
  }

  private recommendDecision(riskScore: number): UnderwritingDecision {
    if (riskScore <= 40) return UnderwritingDecision.APPROVED;
    if (riskScore <= 65) return UnderwritingDecision.CONDITIONAL;
    if (riskScore <= 85) return UnderwritingDecision.REFERRED;
    return UnderwritingDecision.DECLINED;
  }
}
