import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorRiskService {
  private readonly logger = new Logger(VendorRiskService.name);

  // Dummy vendor security database
  private readonly vendorSecurityScores = new Map<string, { score: number; issues: string[] }>([
    ['VENDOR-001', { score: 85, issues: ['Weak encryption policy', 'Delayed patches'] }],
    ['VENDOR-002', { score: 72, issues: ['No SOC2 audit', 'Missing DPA'] }],
    ['VENDOR-003', { score: 91, issues: [] }],
  ]);

  /**
   * REG-VENDOR-001: Assess third-party vendor security scorecard
   */
  async assessVendorRisk(vendorId: string): Promise<{
    vendorId: string;
    securityScore: number;
    riskLevel: string;
    issues: string[];
    recommendation: string;
  }> {
    const data = this.vendorSecurityScores.get(vendorId) || { score: 75, issues: ['Limited visibility'] };
    const riskLevel = data.score >= 85 ? 'low' : data.score >= 70 ? 'medium' : 'high';
    const recommendation = data.score >= 80
      ? 'Approved for engagement'
      : data.score >= 70
      ? 'Conditional approval - requires remediation plan'
      : 'Not approved - high security risk';

    const assessment = {
      vendorId,
      securityScore: data.score,
      riskLevel,
      issues: data.issues,
      recommendation,
    };

    this.logger.log(`Vendor ${vendorId} assessed: score ${data.score}, level ${riskLevel}`);
    return assessment;
  }

  async findAllVendors(): Promise<string[]> {
    return Array.from(this.vendorSecurityScores.keys());
  }
}
