import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyVersion } from '../entities/policy-version.entity';
import { PolicyVersionStatus } from '../entities/policy-version-status.enum';
import { CreatePolicyVersionDto } from '../dto/create-policy-version.dto';

/**
 * Servicio de versionado de políticas de privacidad
 * Función: PRIV-MISC-001
 */
@Injectable()
export class PolicyVersionService {
  private readonly logger = new Logger(PolicyVersionService.name);

  constructor(
    @InjectRepository(PolicyVersion)
    private readonly repo: Repository<PolicyVersion>,
  ) {}

  async createVersion(dto: CreatePolicyVersionDto): Promise<PolicyVersion> {
    const existing = await this.repo.findOne({ where: { version: dto.version } });
    if (existing) {
      throw new BadRequestException(`La versión ${dto.version} ya existe`);
    }

    const version = this.repo.create({
      version: dto.version,
      content: dto.content,
      status: PolicyVersionStatus.DRAFT,
      requiresReconsent: dto.requiresReconsent || false,
      checksum: null,
      publishedAt: null,
      publishedBy: null,
      acceptanceCount: 0,
    });

    const saved = await this.repo.save(version);
    this.logger.log(`Nueva versión de política creada: ${saved.version}`);
    return saved;
  }

  async listVersions(): Promise<PolicyVersion[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getVersion(id: string): Promise<PolicyVersion> {
    const version = await this.repo.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Versión de política no encontrada: ${id}`);
    }
    return version;
  }

  async getCurrentPublished(): Promise<PolicyVersion> {
    const version = await this.repo.findOne({
      where: { status: PolicyVersionStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
    if (!version) {
      throw new NotFoundException('No hay versión publicada activa');
    }
    return version;
  }

  async publishVersion(id: string, publishedBy: string): Promise<PolicyVersion> {
    const version = await this.getVersion(id);

    if (version.status !== PolicyVersionStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden publicar versiones en draft');
    }

    // Marcar versión anterior como superseded
    const currentPublished = await this.repo.findOne({
      where: { status: PolicyVersionStatus.PUBLISHED },
    });
    if (currentPublished) {
      currentPublished.status = PolicyVersionStatus.SUPERSEDED;
      await this.repo.save(currentPublished);
    }

    version.status = PolicyVersionStatus.PUBLISHED;
    version.publishedAt = new Date();
    version.publishedBy = publishedBy;
    version.checksum = this.generateChecksum(version.content);

    this.logger.log(`Política publicada: versión ${version.version} por ${publishedBy}`);
    return this.repo.save(version);
  }

  async incrementAcceptance(id: string): Promise<void> {
    const version = await this.getVersion(id);
    version.acceptanceCount += 1;
    await this.repo.save(version);
  }

  async checkReconsentRequired(userId: string): Promise<{ requiresReconsent: boolean; version: PolicyVersion | null }> {
    const current = await this.repo.findOne({
      where: { status: PolicyVersionStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
    if (!current || !current.requiresReconsent) {
      return { requiresReconsent: false, version: null };
    }
    return { requiresReconsent: true, version: current };
  }

  private generateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
