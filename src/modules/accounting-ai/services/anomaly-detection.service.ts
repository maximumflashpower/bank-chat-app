import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAnomalyDetectionResult } from '../entities/ai-anomaly-detection-result.entity';
import { FlagFraudDto } from '../dto/flag-fraud.dto';

@Injectable()
export class AnomalyDetectionService {
  constructor(
    @InjectRepository(AiAnomalyDetectionResult)
    private repo: Repository<AiAnomalyDetectionResult>,
  ) {}

  async detectAnomalies(journalEntryId: string, entryData: any): Promise<AiAnomalyDetectionResult> {
    const anomalyTypes = this.analyzeForAnomalies(entryData);
    const riskScore = this.calculateRiskScore(anomalyTypes, entryData);

    const result = this.repo.create({
      journalEntryId,
      anomalyTypesFound: anomalyTypes,
      riskScore,
      investigationStatus: 'new',
      flaggedForFraud: riskScore > 70,
      evidenceSnapshotJson: entryData,
    });
    return this.repo.save(result);
  }

  private analyzeForAnomalies(data: any): string[] {
    const anomalies: string[] = [];
    if (this.isOutlier(data.amount)) anomalies.push('OUTLIER');
    if (this.hasRoundNumber(data.amount)) anomalies.push('ROUND_NUMBER');
    if (this.isDuplicate(data.reference)) anomalies.push('DUPLICATE');
    if (this.isTimeAnomaly(data.timestamp)) anomalies.push('TIME_ANOMALY');
    return anomalies;
  }

  private calculateRiskScore(anomalies: string[], data: any): number {
    let score = 0;
    if (anomalies.includes('OUTLIER')) score += 30;
    if (anomalies.includes('DUPLICATE')) score += 40;
    if (anomalies.includes('ROUND_NUMBER')) score += 15;
    if (anomalies.includes('TIME_ANOMALY')) score += 25;
    return Math.min(score, 100);
  }

  private isOutlier(amount: number): boolean { return amount > 100000; }
  private hasRoundNumber(amount: number): boolean { return amount % 1000 === 0; }
  private isDuplicate(reference: string): boolean { return false; }
  private isTimeAnomaly(timestamp: Date): boolean { return false; }

  async listAll(): Promise<AiAnomalyDetectionResult[]> {
    return this.repo.find({ order: { riskScore: 'DESC' } });
  }

  async findById(id: string): Promise<AiAnomalyDetectionResult | null> {
    return this.repo.findOne({ where: { id } });
  }

  async flagAsFraud(id: string, dto: FlagFraudDto): Promise<void> {
    await this.repo.update(id, {
      flaggedForFraud: true,
      investigationStatus: 'escalated',
    });
  }

  async assignInvestigator(id: string, investigatorId: string): Promise<void> {
    await this.repo.update(id, {
      investigatorAssigned: investigatorId,
      investigationStatus: 'investigating',
    });
  }
}
