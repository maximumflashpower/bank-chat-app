import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InsiderThreatService {
  private readonly logger = new Logger(InsiderThreatService.name);

  // Simulated behavioral monitoring thresholds
  private readonly thresholds = {
    dataDownloadsPerHour: 50,
    unusualAccessTimes: ['00:00-05:00', '23:00-24:00'],
    privilegedActionsWithoutApproval: true,
  };

  /**
   * REG-INSIDER-001: Behavioral monitoring and detection
   */
  async detectInsiderThreat(userId: string, behaviors: {
    dataDownloads: number;
    accessHours: string[];
    privilegedActions: number;
  }): Promise<{
    userId: string;
    riskScore: number;
    flags: string[];
    recommendation: string;
  }> {
    const flags: string[] = [];
    let riskScore = 0;

    if (behaviors.dataDownloads > this.thresholds.dataDownloadsPerHour) {
      flags.push('excessive_data_download');
      riskScore += 30;
    }

    const hasUnusualHours = behaviors.accessHours.some(h =>
      this.thresholds.unusualAccessTimes.some(t => h.startsWith(t.split('-')[0]) || h.startsWith(t.split('-')[1]))
    );
    if (hasUnusualHours) {
      flags.push('unusual_access_hours');
      riskScore += 25;
    }

    if (behaviors.privilegedActions > 0) {
      flags.push('privileged_actions');
      riskScore += 20;
    }

    const recommendation = riskScore >= 50
      ? 'Immediate investigation required - high insider threat risk'
      : riskScore >= 25
      ? 'Monitor closely - elevated risk indicators'
      : 'Normal activity - continue monitoring';

    this.logger.log(`Insider threat detection for ${userId}: risk ${riskScore}, flags: ${flags.join(', ')}`);
    return { userId, riskScore, flags, recommendation };
  }
}
