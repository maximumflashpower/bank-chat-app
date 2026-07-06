import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Servicio de Privacy by Design — implementa principios de privacidad proactiva
 * Cubre funciones: PRIV-PBBDESIGN-001, 002, 003
 */
@Injectable()
export class PrivacyByDesignService {
  private readonly logger = new Logger(PrivacyByDesignService.name);

  /**
   * PRIV-PBBDESIGN-001: Privacy by Design Default Settings
   * Retorna la configuración de privacidad por defecto para nuevos usuarios
   * Todos los consentimientos no esenciales son opt-in (false por defecto)
   */
  getDefaultSettings(): {
    settings: Record<string, boolean>;
    description: string;
    version: string;
  } {
    const settings = {
      // Consentimientos no esenciales — false por defecto (opt-in)
      marketing: false,
      analytics: false,
      third_party_sharing: false,
      profiling: false,
      personalized_ads: false,
      // Consentimientos esenciales — true (requeridos para funcionamiento)
      essential: true,
      security_monitoring: true,
      fraud_detection: true,
    };

    this.logger.log('Default privacy settings retrieved');

    return {
      settings,
      description: 'Configuración por defecto conforme a Privacy by Design: consentimientos no esenciales desactivados salvo consentimiento explícito.',
      version: '2.0',
    };
  }

  /**
   * PRIV-PBBDESIGN-002: Data Minimization Schema Enforcement
   * Valida que un esquema de datos solo recolecta campos necesarios
   * Detecta campos que violan el principio de minimización
   */
  validateDataMinimization(
    schemaName: string,
    fields: { name: string; type: string; purpose: string; required: boolean }[],
  ): {
    valid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Lista de campos sensibles que requieren justificación adicional
    const sensitiveFields = [
      'ssn', 'national_id', 'passport', 'biometric', 'health_data',
      'religion', 'ethnicity', 'sexual_orientation', 'political_opinion',
    ];

    // Lista de campos opcionales que podrían no ser necesarios
    const optionalFields = fields.filter((f) => !f.required);

    for (const field of fields) {
      // Verificar campos sensibles
      if (sensitiveFields.some((sf) => field.name.toLowerCase().includes(sf))) {
        violations.push(
          `Campo '${field.name}' contiene datos de categoría especial (Art. 9 GDPR). Requiere evaluación DPIA.`,
        );
      }

      // Verificar propósito declarado
      if (!field.purpose || field.purpose.trim() === '') {
        violations.push(
          `Campo '${field.name}' no tiene propósito declarado. Viola el principio de limitación de finalidad.`,
        );
      }
    }

    // Recomendar eliminación de campos opcionales sin justificación clara
    for (const opt of optionalFields) {
      if (opt.purpose.length < 10) {
        recommendations.push(
          `Considerar eliminar campo opcional '${opt.name}' — propósito insuficiente: "${opt.purpose}"`,
        );
      }
    }

    const valid = violations.length === 0;

    this.logger.log(
      `Data minimization check: schema=${schemaName}, fields=${fields.length}, violations=${violations.length}, valid=${valid}`,
    );

    return { valid, violations, recommendations };
  }

  /**
   * PRIV-PBBDESIGN-003: Purpose Limitation Tagging
   * Etiqueta campos de datos con propósitos permitidos de procesamiento
   * Asegura que cada campo tenga un propósito explícito y limitado
   */
  tagPurposeLimitation(
    schemaName: string,
    fields: { name: string; allowedPurposes: string[] }[],
  ): {
    tagged: { name: string; allowedPurposes: string[]; restricted: boolean }[];
    summary: string;
  } {
    const validPurposes = [
      'identity_verification',
      'service_delivery',
      'billing',
      'customer_support',
      'fraud_prevention',
      'regulatory_compliance',
      'security',
      'communication',
    ];

    const tagged = fields.map((field) => {
      const invalidPurposes = field.allowedPurposes.filter(
        (p) => !validPurposes.includes(p),
      );

      if (invalidPurposes.length > 0) {
        this.logger.warn(
          `Propósito no estándar detectado: field=${field.name}, purposes=${invalidPurposes.join(', ')}`,
        );
      }

      return {
        name: field.name,
        allowedPurposes: field.allowedPurposes,
        restricted: invalidPurposes.length > 0,
      };
    });

    const restrictedCount = tagged.filter((t) => t.restricted).length;

    this.logger.log(
      `Purpose limitation tagging: schema=${schemaName}, fields=${fields.length}, restricted=${restrictedCount}`,
    );

    return {
      tagged,
      summary: `Esquema '${schemaName}' etiquetado con ${fields.length} campos. ${restrictedCount} campo(s) con propósitos no estándar requieren revisión del DPO.`,
    };
  }
}
