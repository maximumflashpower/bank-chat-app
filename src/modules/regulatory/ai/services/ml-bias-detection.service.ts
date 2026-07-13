import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MlBiasDetectionService {
  private readonly logger = new Logger(MlBiasDetectionService.name);

  // Simulated demographic groups for bias analysis
  private readonly demographicGroups = ['age', 'gender', 'ethnicity', 'income_level', 'geographic_region'];

  /**
   * REG-MOD-004: Machine learning model bias detection
   */
  async detectBias(modelPredictions: {
    modelId: string;
    predictions: { groupId: string; predicted: boolean; actual: boolean; count: number }[];
  }): Promise<{
    scanId: string;
    modelId: string;
    overallBiasScore: number;
    groupDisparities: { group: string; disparity: number }[];
    flaggedGroups: string[];
    recommendations: string[];
    compliant: boolean;
  }> {
    const groupDisparities: { group: string; disparity: number }[] = [];
    const flaggedGroups: string[] = [];

    // Calculate disparity for each demographic group
    for (const pred of modelPredictions.predictions) {
      const predictedRate = pred.count > 0 ? Number(pred.predicted) / pred.count : 0;
      const actualRate = pred.count > 0 ? Number(pred.actual) / pred.count : 0;
      const disparity = Math.abs(predictedRate - actualRate);

      groupDisparities.push({ group: pred.groupId, disparity });

      if (disparity > 0.1) {
        flaggedGroups.push(pred.groupId);
      }
    }

    // Calculate overall bias score
    const maxDisparity = Math.max(...groupDisparities.map(d => d.disparity));
    const overallBiasScore = Math.min(100, maxDisparity * 100);

    const recommendations: string[] = [];
    if (flaggedGroups.length > 0) {
      recommendations.push(`Retrain model with balanced dataset for groups: ${flaggedGroups.join(', ')}`);
      recommendations.push('Apply fairness constraints during training');
    }

    const result = {
      scanId: `BIAS-${Date.now()}`,
      modelId: modelPredictions.modelId,
      overallBiasScore: Math.round(overallBiasScore),
      groupDisparities,
      flaggedGroups,
      recommendations,
      compliant: flaggedGroups.length === 0,
    };

    if (flaggedGroups.length > 0) {
      this.logger.warn(`Bias detected in model ${modelPredictions.modelId}: ${flaggedGroups.length} groups affected`);
    }

    return result;
  }
}
