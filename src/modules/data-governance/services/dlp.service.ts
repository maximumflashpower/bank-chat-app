import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DatagovDlpRule,
  DlpAction,
  DlpSeverity,
} from '../entities/datagov-dlp-rule.entity';
import { DatagovDlpViolation } from '../entities/datagov-dlp-violation.entity';

/**
 * Data Loss Prevention (DLP) - Interceptación en tiempo real
 * Cubre funciones: DATAGOV-DLP-001 a 007
 */
@Injectable()
export class DlpService {
  private readonly logger = new Logger(DlpService.name);

  constructor(
    @InjectRepository(DatagovDlpRule)
    private readonly ruleRepo: Repository<DatagovDlpRule>,
    @InjectRepository(DatagovDlpViolation)
    private readonly violationRepo: Repository<DatagovDlpViolation>,
  ) {}

  /**
   * DATAGOV-DLP-001: Real-Time Interception
   */
  async evaluateContent(
    content: string,
    channel: string,
    userId: string,
  ): Promise<{ blocked: boolean; matchedRules: string[]; action: DlpAction }> {
    const activeRules = await this.ruleRepo.find({ where: { isActive: true } });

    const matchedRules: string[] = [];
    let blocked = false;
    let highestSeverity: DlpSeverity | undefined = undefined;

    for (const rule of activeRules) {
      if (this.contentMatches(content, rule)) {
        matchedRules.push(rule.id);
        
        // Verificar si es bloqueado
        if (rule.action === DlpAction.BLOCK || rule.action === DlpAction.MASK) {
          blocked = true;
        }

        // Trackear severidad máxima
        if (this.severityLevel(rule.severity) > this.severityLevel(highestSeverity)) {
          highestSeverity = rule.severity;
        }

        // Registrar violación
        await this.recordViolation(rule, userId, channel, content, blocked, highestSeverity);
      }
    }

    return { blocked, matchedRules, action: DlpAction.WARN };
  }

  /**
   * DATAGOV-DLP-002: Detection Patterns
   */
  private contentMatches(content: string, rule: DatagovDlpRule): boolean {
    try {
      // Soporte para regex o palabras clave
      if (rule.detectionPattern.startsWith('/')) {
        const regexStr = rule.detectionPattern.slice(1, rule.detectionPattern.lastIndexOf('/'));
        const regex = new RegExp(regexStr, 'i');
        return regex.test(content);
      }
      // Keyword matching simple
      return content.toLowerCase().includes(rule.detectionPattern.toLowerCase());
    } catch (e) {
      this.logger.warn(`Regex inválido en regla ${rule.ruleName}: ${(e as Error).message}`);
      return false;
    }
  }

  /**
   * DATAGOV-DLP-003: Actions (block/mask/log/warn)
   */
  async getActions(): Promise<DlpAction[]> {
    return Object.values(DlpAction);
  }

  /**
   * DATAGOV-DLP-004: Channels Covered
   */
  async getAvailableChannels(): Promise<string[]> {
    return ['email', 'export', 'api', 'chat', 'print', 'download'];
  }

  /**
   * DATAGOV-DLP-005: Violation Logging
   */
  async recordViolation(
    rule: DatagovDlpRule,
    userId: string,
    channel: string,
    content: string,
    blocked: boolean,
    severity?: DlpSeverity,
  ): Promise<DatagovDlpViolation> {
    const violation = new DatagovDlpViolation();
    violation.ruleId = rule.id;
    violation.userId = userId;
    violation.channel = channel;
    violation.attemptedAction = 'export';
    violation.blocked = blocked;
    violation.contentSnippetMasked = this.maskContent(content, rule.dataTypesMatched);
    violation.justification = null;
    violation.approvalId = null;
    violation.severity = severity || rule.severity;
    violation.resolved = false;

    return this.violationRepo.save(violation);
  }

  /**
   * DATAGOV-DLP-006: Exception Approval Workflow
   */
  async approveException(
    violationId: string,
    approvalId: string,
    justification: string,
  ): Promise<DatagovDlpViolation> {
    const violation = await this.getViolation(violationId);
    
    violation.resolved = true;
    violation.justification = justification;
    violation.approvalId = approvalId;

    return this.violationRepo.save(violation);
  }

  /**
   * DATAGOV-DLP-007: User Exception Whitelist
   */
  async createUserException(userId: string, ruleId: string, expiryDate?: Date): Promise<void> {
    const rule = await this.getRule(ruleId);
    const existingExceptions = rule.userExceptions || [];

    if (!existingExceptions.includes(userId)) {
      rule.userExceptions = [...existingExceptions, userId];
      await this.ruleRepo.save(rule);
      this.logger.log(`Excepción agregada: user=${userId}, rule=${rule.ruleName}`);
    }
  }

  async createRule(dto: {
    ruleName: string;
    detectionPattern: string;
    dataTypesMatched: string[];
    action: DlpAction;
    channelsApplied: string[];
    severity?: DlpSeverity;
  }): Promise<DatagovDlpRule> {
    const rule = new DatagovDlpRule();
    rule.ruleName = dto.ruleName;
    rule.detectionPattern = dto.detectionPattern;
    rule.dataTypesMatched = dto.dataTypesMatched;
    rule.action = dto.action;
    rule.channelsApplied = dto.channelsApplied;
    rule.userExceptions = [];
    rule.severity = dto.severity || DlpSeverity.MEDIUM;
    rule.isActive = true;

    const saved = await this.ruleRepo.save(rule);
    this.logger.log(`Regla DLP creada: ${saved.ruleName}, acción=${dto.action}`);

    return saved;
  }

  async getAllViolations(limit: number = 100): Promise<DatagovDlpViolation[]> {
    return this.violationRepo.find({
      order: { detectedAt: 'DESC' },
      take: limit,
    });
  }

  async getRule(id: string): Promise<DatagovDlpRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Regla DLP ${id} no encontrada`);
    return rule;
  }

  async getViolation(id: string): Promise<DatagovDlpViolation> {
    const violation = await this.violationRepo.findOne({ where: { id } });
    if (!violation) throw new NotFoundException(`Violación ${id} no encontrada`);
    return violation;
  }

  /**
   * Mascara contenido sensible según tipo PII
   */
  private maskContent(content: string, piiTypes: string[]): string {
    let masked = content;

    for (const type of piiTypes) {
      if (type.toLowerCase() === 'email') {
        masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_MASKED]');
      } else if (type.toLowerCase() === 'phone') {
        masked = masked.replace(/\+?\d{10,15}/g, '[PHONE_MASKED]');
      } else if (type.toLowerCase() === 'ssn') {
        masked = masked.replace(/\d{3}-\d{2}-\d{4}/g, '[SSN_MASKED]');
      } else if (type.toLowerCase() === 'card') {
        masked = masked.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CARD_MASKED]');
      }
    }

    return masked.substring(0, 100);
  }

  private severityLevel(severity: DlpSeverity | null | undefined): number {
    if (!severity) return 0;
    const levels: Record<DlpSeverity, number> = {
      [DlpSeverity.LOW]: 1,
      [DlpSeverity.MEDIUM]: 2,
      [DlpSeverity.HIGH]: 3,
      [DlpSeverity.CRITICAL]: 4,
    };
    return levels[severity];
  }
}
