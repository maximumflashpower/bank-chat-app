import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DlPService {
  private readonly logger = new Logger(DlPService.name);

  private readonly sensitivePatterns = [
    /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Z|a-z]{2,}\\b/g, // email
    /\\b\\d{3}[-.]?\\d{2}[-.]?\\d{4}\\b/g, // SSN pattern
    /\\b(?:\\d{4}[ -]?){4}\\b/g, // credit card
  ];

  /**
   * REG-DLP-001: Data loss prevention policy enforcement
   */
  async scanContent(content: string, policyName: string): Promise<{
    scanId: string;
    policyName: string;
    violations: string[];
    blocked: boolean;
    severity: string;
  }> {
    const violations: string[] = [];

    for (const pattern of this.sensitivePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        violations.push(`${pattern.toString()} matched ${matches.length} times`);
      }
    }

    const severity = violations.length >= 3 ? 'high' : violations.length >= 1 ? 'medium' : 'low';
    const blocked = severity === 'high';

    const result = {
      scanId: `DLP-${Date.now()}`,
      policyName,
      violations,
      blocked,
      severity,
    };

    if (violations.length > 0) {
      this.logger.warn(`DLP violation detected: ${policyName} - ${violations.length} findings`);
    }

    return result;
  }

  /**
   * Enforce DLP policy on outbound transmission
   */
  async enforceOnTransmission(payload: string, destination: string, policyName: string): Promise<{
    allowed: boolean;
    reason: string;
    scanResult: { violations: string[]; severity: string };
  }> {
    const scan = await this.scanContent(payload, policyName);
    const allowed = !scan.blocked;

    return {
      allowed,
      reason: allowed
        ? 'Content cleared for transmission'
        : `Blocked due to ${scan.severity} severity DLP violations`,
      scanResult: { violations: scan.violations, severity: scan.severity },
    };
  }
}
