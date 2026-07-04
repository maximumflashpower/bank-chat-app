import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovFrameworkMapping } from '../entities/gov-framework-mapping.entity';
import { FrameworkMapDto } from '../dto/framework-map.dto';
import { FrameworkStatus } from '../entities/framework-status.enum';

@Injectable()
export class FrameworkService {
  private readonly logger = new Logger(FrameworkService.name);

  constructor(
    @InjectRepository(GovFrameworkMapping)
    private readonly frameworkRepo: Repository<GovFrameworkMapping>,
  ) {}

  async mapToFramework(
    dto: FrameworkMapDto,
    assessorId: string,
  ): Promise<GovFrameworkMapping> {
    const mapping = this.frameworkRepo.create({
      ...dto,
      assessorId,
      lastAssessed: new Date(),
      status: FrameworkStatus.COMPLIANT,
    });
    const saved = await this.frameworkRepo.save(mapping);
    this.logger.log(
      `Framework mapping created: ${saved.id} — ${dto.frameworkName}/${dto.frameworkControl}`,
    );
    return saved;
  }

  async findAll(frameworkName?: string): Promise<GovFrameworkMapping[]> {
    const where: any = {};
    if (frameworkName) where.frameworkName = frameworkName;
    return this.frameworkRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findByPolicy(policyId: string): Promise<GovFrameworkMapping[]> {
    return this.frameworkRepo.find({ where: { policyId } });
  }

  async gapAnalysis(frameworkName: string): Promise<{
    framework: string;
    totalControls: number;
    compliant: number;
    nonCompliant: number;
    partial: number;
    coveragePct: number;
  }> {
    const mappings = await this.findAll(frameworkName);
    const totalControls = mappings.length;
    const compliant = mappings.filter(
      (m) => m.status === FrameworkStatus.COMPLIANT,
    ).length;
    const nonCompliant = mappings.filter(
      (m) => m.status === FrameworkStatus.NON_COMPLIANT,
    ).length;
    const partial = mappings.filter(
      (m) => m.status === FrameworkStatus.PARTIALLY,
    ).length;
    const avgCoverage =
      totalControls > 0
        ? mappings.reduce((sum, m) => sum + Number(m.coveragePct), 0) /
          totalControls
        : 0;
    return {
      framework: frameworkName,
      totalControls,
      compliant,
      nonCompliant,
      partial,
      coveragePct: Math.round(avgCoverage * 100) / 100,
    };
  }

  async updateCoverage(
    id: string,
    coveragePct: number,
  ): Promise<GovFrameworkMapping> {
    const mapping = await this.frameworkRepo.findOne({ where: { id } });
    if (!mapping)
      throw new NotFoundException(`Framework mapping ${id} not found`);
    mapping.coveragePct = coveragePct;
    mapping.lastAssessed = new Date();
    if (coveragePct >= 100) {
      mapping.status = FrameworkStatus.COMPLIANT;
    } else if (coveragePct >= 50) {
      mapping.status = FrameworkStatus.PARTIALLY;
    } else {
      mapping.status = FrameworkStatus.NON_COMPLIANT;
    }
    const updated = await this.frameworkRepo.save(mapping);
    this.logger.log(
      `Framework mapping updated: ${id} — coverage: ${coveragePct}% — status: ${updated.status}`,
    );
    return updated;
  }
}
