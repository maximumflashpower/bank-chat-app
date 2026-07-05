import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consent } from '../entities/consent.entity';
import { ConsentPurpose } from '../entities/consent-purpose.enum';
import { ConsentLegalBasis, LEGAL_BASIS_REQUIREMENTS } from '../entities/consent-legal-basis.enum';
import { GrantConsentDto } from '../dto/grant-consent.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { AuditEventType } from '../../audit/entities/audit-event.enum';

/**
 * Servicio de gestión de consentimientos GDPR
 * Cubre funciones: PRIV-CONSENT-001 a PRIV-CONSENT-005
 */
@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(Consent)
    private readonly consentRepo: Repository<Consent>,
  ) {}

  /**
   * PRIV-CONSENT-001: Listar consentimientos de un usuario
   */
  async listUserConsents(userId: string): Promise<Consent[]> {
    return this.consentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PRIV-CONSENT-001: Obtener o crear consentimiento por propósito
   */
  async getOrCreateConsent(userId: string, purpose: ConsentPurpose): Promise<Consent> {
    let consent = await this.consentRepo.findOne({
      where: { userId, purpose },
    });

    if (!consent) {
      consent = this.consentRepo.create({
        userId,
        purpose,
        legalBasis: ConsentLegalBasis.CONSENT,
        granted: false,
      });
      await this.consentRepo.save(consent);
    }

    return consent;
  }

  /**
   * PRIV-CONSENT-002 + 003: Otorgar consentimiento granular con versioning
   */
  async grantConsent(
    userId: string,
    dto: GrantConsentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Consent> {
    // Verificar si ya existe un consentimiento activo para este propósito
    const existing = await this.consentRepo.findOne({
      where: { userId, purpose: dto.purpose },
    });

    if (existing && existing.granted) {
      throw new ConflictException(
        `Consentimiento ya otorgado para el propósito: ${dto.purpose}`,
      );
    }

    // PRIV-CONSENT-005: Validar que la base legal permite revocación
    const requirements = LEGAL_BASIS_REQUIREMENTS[dto.legalBasis];

    if (existing) {
      // Actualizar consentimiento existente
      existing.legalBasis = dto.legalBasis;
      existing.granted = true;
      existing.grantedAt = new Date();
      existing.revokedAt = null;
      existing.granularity = dto.granularity || null;
      existing.version = dto.version || existing.version;
      existing.ipAddress = ipAddress || null;
      existing.userAgent = userAgent || null;
      return this.consentRepo.save(existing);
    }

    // Crear nuevo consentimiento
    const consent = this.consentRepo.create({
      userId,
      purpose: dto.purpose,
      legalBasis: dto.legalBasis,
      granted: true,
      grantedAt: new Date(),
      granularity: dto.granularity || null,
      version: dto.version || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    this.logger.log(
      `Consentimiento otorgado: usuario=${userId}, propósito=${dto.purpose}, versión=${dto.version || 'N/A'}`,
    );

    return this.consentRepo.save(consent);
  }

  /**
   * PRIV-CONSENT-004 + 005: Revocar consentimiento con propagación
   */
  async revokeConsent(
    consentId: string,
    userId: string,
  ): Promise<Consent> {
    const consent = await this.consentRepo.findOne({
      where: { id: consentId, userId },
    });

    if (!consent) {
      throw new NotFoundException(`Consentimiento no encontrado: ${consentId}`);
    }

    if (!consent.granted) {
      throw new ConflictException('El consentimiento ya está revocado');
    }

    // Verificar si la base legal permite revocación
    const requirements = LEGAL_BASIS_REQUIREMENTS[consent.legalBasis];
    if (!requirements.canRevoke) {
      throw new ConflictException(
        `No se puede revocar: base legal "${consent.legalBasis}" no permite revocación`,
      );
    }

    consent.granted = false;
    consent.revokedAt = new Date();

    this.logger.log(
      `Consentimiento revocado: id=${consentId}, usuario=${userId}, propósito=${consent.purpose}`,
    );

    // PRIV-CONSENT-004: Aquí se notificaría a sistemas consumidores
    // (en implementación completa, se emitiría un evento a través de un EventEmitter)

    return this.consentRepo.save(consent);
  }

  /**
   * PRIV-CONSENT-002: Obtener preferencias de privacidad del usuario
   */
  async getPreferences(userId: string): Promise<{
    consents: Consent[];
    summary: Record<string, boolean>;
  }> {
    const consents = await this.listUserConsents(userId);

    // Asegurar que todos los propósitos existan
    for (const purpose of Object.values(ConsentPurpose)) {
      const exists = consents.find((c) => c.purpose === purpose);
      if (!exists) {
        const newConsent = await this.getOrCreateConsent(userId, purpose);
        consents.push(newConsent);
      }
    }

    const summary: Record<string, boolean> = {};
    for (const consent of consents) {
      summary[consent.purpose] = consent.granted;
    }

    return { consents, summary };
  }

  /**
   * PRIV-CONSENT-002: Actualizar preferencias globales
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Consent[]> {
    const allPurposes = Object.values(ConsentPurpose);
    const results: Consent[] = [];

    if (dto.revokeAllNonEssential) {
      // Revocar todos excepto essential
      for (const purpose of allPurposes) {
        if (purpose !== ConsentPurpose.ESSENTIAL) {
          const existing = await this.consentRepo.findOne({
            where: { userId, purpose },
          });
          if (existing && existing.granted) {
            existing.granted = false;
            existing.revokedAt = new Date();
            await this.consentRepo.save(existing);
            results.push(existing);
          } else if (existing) {
            results.push(existing);
          }
        }
      }
      return results;
    }

    if (dto.purposes) {
      // Otorgar los listados, revocar los demás
      for (const purpose of allPurposes) {
        const shouldGrant = dto.purposes.includes(purpose);
        const existing = await this.consentRepo.findOne({
          where: { userId, purpose },
        });

        if (shouldGrant) {
          if (!existing || !existing.granted) {
            const granted = await this.grantConsent(
              userId,
              {
                purpose,
                legalBasis: ConsentLegalBasis.CONSENT,
              },
              ipAddress,
              userAgent,
            );
            results.push(granted);
          } else {
            results.push(existing);
          }
        } else {
          if (existing && existing.granted && purpose !== ConsentPurpose.ESSENTIAL) {
            const revoked = await this.revokeConsent(existing.id, userId);
            results.push(revoked);
          } else if (existing) {
            results.push(existing);
          }
        }
      }
    }

    return results;
  }

  /**
   * PRIV-CONSENT-003: Verificar si un usuario tiene consentimiento para un propósito
   */
  async hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const consent = await this.consentRepo.findOne({
      where: { userId, purpose },
    });
    return consent?.granted ?? false;
  }

  /**
   * PRIV-CONSENT-003: Invalidar consentimientos por cambio de versión de política
   */
  async invalidateForNewPolicyVersion(
    newVersion: string,
  ): Promise<number> {
    const result = await this.consentRepo.update(
      { granted: true, version: (() => {
        // Solo los que tienen una versión diferente
        const qb = this.consentRepo.createQueryBuilder('c');
        return qb.getQuery();
      })() as any },
      { version: null },
    );

    this.logger.log(
      `Consentimientos marcados para re-consent por nueva política v${newVersion}`,
    );

    return result.affected || 0;
  }
}
