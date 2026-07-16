import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DatagovClassification,
  SensitivityLabel,
  ClassificationMethod,
  PIIType,
} from '../entities/datagov-classification.entity';

/**
 * Servicio de clasificación automática de datos y detección de PII
 * Cubre funciones: DATAGOV-CLASS-001 a 005
 */
@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  // Patrones básicos de PII para detección automática
  private readonly piiPatterns: Record<string, RegExp> = {
    [PIIType.EMAIL]: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    [PIIType.PHONE]: /^\+?\d{10,15}$/,
    [PIIType.SSN]: /^\d{3}-\d{2}-\d{4}$/,
    [PIIType.CARD]: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  };

  constructor(
    @InjectRepository(DatagovClassification)
    private readonly classRepo: Repository<DatagovClassification>,
  ) {}

  /**
   * DATAGOV-CLASS-001: Auto Data Classification PII Detection Engine
   */
  async autoClassify(
    entityType: string,
    entityIdentifier: string,
    sampleContent?: string,
  ): Promise<DatagovClassification> {
    const piiType = this.detectPII(sampleContent || entityIdentifier);
    const sensitivity = this.determineSensitivity(piiType, entityIdentifier);
    const confidence = piiType !== PIIType.NONE ? 85.0 : 60.0;

    const classification = new DatagovClassification();
    classification.entityType = entityType;
    classification.entityIdentifier = entityIdentifier;
    classification.sensitivityLabel = sensitivity;
    classification.classificationMethod = ClassificationMethod.AUTO;
    classification.piiType = piiType;
    classification.confidenceScore = confidence;
    classification.appliesMasking = sensitivity === SensitivityLabel.CONFIDENTIAL || sensitivity === SensitivityLabel.RESTRICTED;
    classification.appliesEncryption = sensitivity === SensitivityLabel.RESTRICTED;
    classification.overridesDefault = false;
    classification.classifiedBy = null;
    classification.reevaluateAt = this.calculateReevaluationDate();

    const saved = await this.classRepo.save(classification);
    this.logger.log(`Auto-clasificación: entity=${entityIdentifier}, label=${sensitivity}, pii=${piiType}`);

    return saved;
  }

  /**
   * DATAGOV-CLASS-002: Sensitivity Labels
   */
  async classify(
    entityType: string,
    entityIdentifier: string,
    sensitivityLabel: SensitivityLabel,
    piiType?: PIIType,
    classifiedBy?: string,
  ): Promise<DatagovClassification> {
    const classification = new DatagovClassification();
    classification.entityType = entityType;
    classification.entityIdentifier = entityIdentifier;
    classification.sensitivityLabel = sensitivityLabel;
    classification.classificationMethod = ClassificationMethod.MANUAL;
    classification.piiType = piiType || PIIType.NONE;
    classification.confidenceScore = 100.0;
    classification.appliesMasking = sensitivityLabel === SensitivityLabel.CONFIDENTIAL || sensitivityLabel === SensitivityLabel.RESTRICTED;
    classification.appliesEncryption = sensitivityLabel === SensitivityLabel.RESTRICTED;
    classification.overridesDefault = false;
    classification.classifiedBy = classifiedBy || null;
    classification.reevaluateAt = this.calculateReevaluationDate();

    return this.classRepo.save(classification);
  }

  /**
   * DATAGOV-CLASS-003: Classification Override Manual Steward
   */
  async overrideClassification(
    classificationId: string,
    newLabel: SensitivityLabel,
    stewardId: string,
    reason?: string,
  ): Promise<DatagovClassification> {
    const classification = await this.findById(classificationId);

    classification.sensitivityLabel = newLabel;
    classification.classificationMethod = ClassificationMethod.MANUAL;
    classification.overridesDefault = true;
    classification.classifiedBy = stewardId;
    classification.appliesMasking = newLabel === SensitivityLabel.CONFIDENTIAL || newLabel === SensitivityLabel.RESTRICTED;
    classification.appliesEncryption = newLabel === SensitivityLabel.RESTRICTED;

    const saved = await this.classRepo.save(classification);
    this.logger.log(`Override manual: id=${classificationId}, nuevo=${newLabel}, steward=${stewardId}`);

    return saved;
  }

  /**
   * DATAGOV-CLASS-004: Periodic Reclassification Context Change
   */
  async reclassifyExpired(): Promise<number> {
    const now = new Date();
    const expired = await this.classRepo.find({
      where: {},
    });

    let count = 0;
    for (const c of expired) {
      if (c.reevaluateAt && c.reevaluateAt < now) {
        // Re-evaluar
        const newLabel = c.sensitivityLabel; // En producción re-analizar
        c.reevaluateAt = this.calculateReevaluationDate();
        await this.classRepo.save(c);
        count++;
      }
    }

    this.logger.log(`Reclasificación periódica: ${count} entidades reevaluadas`);
    return count;
  }

  /**
   * DATAGOV-CLASS-005: Classification Confidence Score
   */
  async getConfidenceScore(classificationId: string): Promise<{ score: number; label: SensitivityLabel }> {
    const c = await this.findById(classificationId);
    return { score: c.confidenceScore || 0, label: c.sensitivityLabel };
  }

  async findByEntity(entityIdentifier: string): Promise<DatagovClassification | null> {
    return this.classRepo.findOne({ where: { entityIdentifier } });
  }

  async findById(id: string): Promise<DatagovClassification> {
    const c = await this.classRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Clasificación ${id} no encontrada`);
    return c;
  }

  /**
   * Detectar tipo de PII en contenido
   */
  private detectPII(content: string): PIIType {
    for (const [type, pattern] of Object.entries(this.piiPatterns)) {
      if (pattern.test(content)) {
        return type as PIIType;
      }
    }
    // Heurísticas por nombre de columna
    const lower = content.toLowerCase();
    if (lower.includes('email') || lower.includes('mail')) return PIIType.EMAIL;
    if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) return PIIType.PHONE;
    if (lower.includes('ssn') || lower.includes('social')) return PIIType.SSN;
    if (lower.includes('card') || lower.includes('pan')) return PIIType.CARD;
    if (lower.includes('medical') || lower.includes('health')) return PIIType.MEDICAL;
    if (lower.includes('address') || lower.includes('street')) return PIIType.ADDRESS;

    return PIIType.NONE;
  }

  /**
   * Determinar sensitivity label basado en PII
   */
  private determineSensitivity(piiType: PIIType, identifier: string): SensitivityLabel {
    if (piiType === PIIType.SSN || piiType === PIIType.CARD || piiType === PIIType.MEDICAL) {
      return SensitivityLabel.RESTRICTED;
    }
    if (piiType === PIIType.EMAIL || piiType === PIIType.PHONE || piiType === PIIType.ADDRESS) {
      return SensitivityLabel.CONFIDENTIAL;
    }
    // Heurística por nombre
    const lower = identifier.toLowerCase();
    if (lower.includes('public') || lower.includes('blog') || lower.includes('faq')) {
      return SensitivityLabel.PUBLIC;
    }
    return SensitivityLabel.INTERNAL;
  }

  private calculateReevaluationDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Re-evaluar cada 3 meses
    return date;
  }
}
