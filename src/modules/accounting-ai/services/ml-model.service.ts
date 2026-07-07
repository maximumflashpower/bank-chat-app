import { Injectable } from '@nestjs/common';

interface ModelMetrics {
  modelName: string;
  version: string;
  precision: number;
  recall: number;
  f1Score: number;
  driftDetected: boolean;
  lastTrainedAt: Date;
  predictionsCount: number;
}

const modelsStore: ModelMetrics[] = [
  {
    modelName: 'journal-suggester',
    version: '1.2.0',
    precision: 0.89,
    recall: 0.84,
    f1Score: 0.86,
    driftDetected: false,
    lastTrainedAt: new Date(),
    predictionsCount: 0,
  },
  {
    modelName: 'anomaly-detector',
    version: '2.0.1',
    precision: 0.92,
    recall: 0.78,
    f1Score: 0.84,
    driftDetected: false,
    lastTrainedAt: new Date(),
    predictionsCount: 0,
  },
  {
    modelName: 'cashflow-classifier',
    version: '1.0.5',
    precision: 0.87,
    recall: 0.91,
    f1Score: 0.89,
    driftDetected: true,
    lastTrainedAt: new Date(),
    predictionsCount: 0,
  },
];

@Injectable()
export class MlModelService {
  async getPerformance(): Promise<ModelMetrics[]> {
    return modelsStore;
  }

  async retrain(modelName: string): Promise<ModelMetrics | null> {
    const model = modelsStore.find(m => m.modelName === modelName);
    if (!model) return null;

    model.lastTrainedAt = new Date();
    model.driftDetected = false;
    model.predictionsCount = 0;
    model.version = this.bumpVersion(model.version);
    return model;
  }

  async recordPrediction(modelName: string): Promise<void> {
    const model = modelsStore.find(m => m.modelName === modelName);
    if (model) model.predictionsCount++;
  }

  async explainPrediction(modelName: string, inputFeatures: any): Promise<{ rationale: string; contributingFactors: string[] }> {
    const factors: string[] = [];
    if (inputFeatures.amount) factors.push(`Amount: ${inputFeatures.amount}`);
    if (inputFeatures.vendor) factors.push(`Vendor match: ${inputFeatures.vendor}`);
    if (inputFeatures.historicalPattern) factors.push(`Historical pattern alignment`);

    return {
      rationale: `Model ${modelName} produced suggestion based on ${factors.length} key features`,
      contributingFactors: factors,
    };
  }

  private bumpVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}
