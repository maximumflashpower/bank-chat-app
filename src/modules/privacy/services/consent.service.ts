import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyConsent, ConsentPurpose, LegalBasis } from '../entities/privacy-consent.entity';

/**
 * Servicio de gestión de consentimientos granulares
 * Cubre funciones: PRIV-CONSENT-001 a PRIV-CONSENT-005
 */
@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(PrivacyConsent)
    private readonly consentRepo: Repository<PrivacyConsent>,
  ) {}

  /**
   * Listar todos los consentimientos (admin view)
   */
  async findAll(page: number = 1, limit: number = 20): Promise<{ data: PrivacyConsent[]; total: number }> {
    const [data, total] = await this.consentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  /**
   * PRIV-CONSENT-001: Listar consentimientos por usuario
   */
  async findByCustomer(userId: string): Promise<PrivacyConsent[]> {
    return this.consentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Alias para compatibilidad con controller
   */
  async listUserConsents(userId: string): Promise<PrivacyConsent[]> {
    return this.findByCustomer(userId);
  }

  /**
   * PRIV-CONSENT-002: Otorgar consentimiento granular
   */
  async grant(
    userId: string,
    purpose: ConsentPurpose,
    dto: {
      legalBasis: LegalBasis;
      granularity?: Record<string, boolean>;
      version?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<PrivacyConsent> {
    // Verificar si ya existe y está otorgado
    const existing = await this.consentRepo.findOne({
      where: { userId, purpose },
    });

    if (existing && existing.granted) {
      throw new Error(`Consentimiento ya otorgado para propósito: ${purpose}`);
    }

    const consent = new PrivacyConsent();
    consent.userId = userId;
    consent.purpose = purpose;
    consent.legalBasis = dto.legalBasis;
    consent.granted = true;
    consent.grantedAt = new Date();
    consent.revokedAt = null;
    consent.granularity = dto.granularity || null;
    consent.version = dto.version || '1.0';
    consent.ipAddress = dto.ipAddress || null;
    consent.userAgent = dto.userAgent || null;

    const saved = await this.consentRepo.save(consent);

    this.logger.log(`Consentimiento otorgado: userId=${userId}, purpose=${purpose}`);

    return saved;
  }

  /**
   * Alias para compatibilidad con controller
   */
  async grantConsent(
    userId: string,
    dto: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PrivacyConsent> {
    return this.grant(userId, dto.purpose, {
      legalBasis: dto.legalBasis,
      granularity: dto.granularity,
      version: dto.version,
      ipAddress,
      userAgent,
    });
  }

  /**
   * PRIV-CONSENT-004: Revocar consentimiento específico
   */
  async revoke(consentId: string, userId?: string): Promise<PrivacyConsent> {
    const where: Record<string, unknown> = { id: consentId };
    if (userId) {
      where['userId'] = userId;
    }

    const consent = await this.consentRepo.findOne({ where });
    if (!consent) {
      throw new NotFoundException(`Consentimiento ${consentId} no encontrado`);
    }

    if (!consent.granted) {
      throw new Error('Este consentimiento nunca fue otorgado');
    }

    consent.granted = false;
    consent.revokedAt = new Date();

    const saved = await this.consentRepo.save(consent);

    this.logger.log(`Consentimiento revocado: consentId=${consentId}, userId=${consent.userId}`);

    return saved;
  }

  /**
   * Alias para compatibilidad con controller
   */
  async revokeConsent(consentId: string, userId?: string): Promise<PrivacyConsent> {
    return this.revoke(consentId, userId);
  }

  /**
   * Update consentimiento (granularidad)
   */
  async update(consentId: string, dto: {
    granted?: boolean;
    granularity?: Record<string, boolean>;
    revokedAt?: string;
  }): Promise<PrivacyConsent> {
    const consent = await this.consentRepo.findOne({
      where: { id: consentId },
    });

    if (!consent) {
      throw new NotFoundException(`Consentimiento ${consentId} no encontrado`);
    }

    if (dto.granted !== undefined) {
      consent.granted = dto.granted;
    }
    if (dto.granularity !== undefined) {
      consent.granularity = dto.granularity;
    }
    if (dto.revokedAt) {
      consent.revokedAt = new Date(dto.revokedAt);
    }

    return this.consentRepo.save(consent);
  }

  /**
   * Check if user has granted consent for specific purpose
   */
  async hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const consent = await this.consentRepo.findOne({
      where: { userId, purpose, granted: true },
    });
    return !!consent;
  }

  /**
   * PRIV-CONSENT-005: Revoke ALL consents for user (global opt-out)
   */
  async revokeAll(userId: string): Promise<number> {
    const consents = await this.consentRepo.find({
      where: { userId, granted: true },
    });

    let count = 0;
    for (const consent of consents) {
      consent.granted = false;
      consent.revokedAt = new Date();
      await this.consentRepo.save(consent);
      count++;
    }

    this.logger.log(`Consentimientos revocados masivamente: userId=${userId}, count=${count}`);

    return count;
  }

  /**
   * Centro de preferencias de privacidad (consolidado)
   */
  async getPreferences(userId: string): Promise<{
    consents: PrivacyConsent[];
    marketingEnabled: boolean;
    analyticsEnabled: boolean;
    thirdPartyEnabled: boolean;
  }> {
    const consents = await this.findByCustomer(userId);

    const marketingEnabled = consents.some(c => c.purpose === ConsentPurpose.MARKETING && c.granted);
    const analyticsEnabled = consents.some(c => c.purpose === ConsentPurpose.ANALYTICS && c.granted);
    const thirdPartyEnabled = consents.some(c => c.purpose === ConsentPurpose.THIRD_PARTY && c.granted);

    return {
      consents,
      marketingEnabled,
      analyticsEnabled,
      thirdPartyEnabled,
    };
  }

  /**
   * Actualizar preferencias globales (bulk update)
   */
  async updatePreferences(
    userId: string,
    dto: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PrivacyConsent[]> {
    const updates: PrivacyConsent[] = [];

    if (dto.marketingEnabled !== undefined) {
      const consent = await this.ensureConsent(userId, ConsentPurpose.MARKETING, LegalBasis.CONSENT);
      consent.granted = dto.marketingEnabled;
      consent.grantedAt = dto.marketingEnabled ? new Date() : consent.grantedAt;
      consent.revokedAt = dto.marketingEnabled ? null : new Date();
      consent.ipAddress = ipAddress || consent.ipAddress;
      consent.userAgent = userAgent || consent.userAgent;
      updates.push(await this.consentRepo.save(consent));
    }

    if (dto.analyticsEnabled !== undefined) {
      const consent = await this.ensureConsent(userId, ConsentPurpose.ANALYTICS, LegalBasis.CONSENT);
      consent.granted = dto.analyticsEnabled;
      consent.grantedAt = dto.analyticsEnabled ? new Date() : consent.grantedAt;
      consent.revokedAt = dto.analyticsEnabled ? null : new Date();
      consent.ipAddress = ipAddress || consent.ipAddress;
      consent.userAgent = userAgent || consent.userAgent;
      updates.push(await this.consentRepo.save(consent));
    }

    if (dto.thirdPartyEnabled !== undefined) {
      const consent = await this.ensureConsent(userId, ConsentPurpose.THIRD_PARTY, LegalBasis.CONSENT);
      consent.granted = dto.thirdPartyEnabled;
      consent.grantedAt = dto.thirdPartyEnabled ? new Date() : consent.grantedAt;
      consent.revokedAt = dto.thirdPartyEnabled ? null : new Date();
      consent.ipAddress = ipAddress || consent.ipAddress;
      consent.userAgent = userAgent || consent.userAgent;
      updates.push(await this.consentRepo.save(consent));
    }

    this.logger.log(`Preferencias actualizadas: userId=${userId}, updated=${updates.length}`);

    return updates;
  }

  /**
   * Helper: asegurar que exista un consentimiento
   */
  private async ensureConsent(userId: string, purpose: ConsentPurpose, legalBasis: LegalBasis): Promise<PrivacyConsent> {
    let consent = await this.consentRepo.findOne({
      where: { userId, purpose },
    });

    if (!consent) {
      consent = new PrivacyConsent();
      consent.userId = userId;
      consent.purpose = purpose;
      consent.legalBasis = legalBasis;
      consent.granted = false;
      consent.version = '1.0';
      consent = await this.consentRepo.save(consent);
    }

    return consent;
  }
}
