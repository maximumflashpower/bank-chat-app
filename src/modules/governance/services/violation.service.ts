import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GovViolation } from '../entities/gov-violation.entity';
import { ResolveViolationDto } from '../dto/resolve-violation.dto';
import { ViolationStatus } from '../entities/violation-status.enum';
import { Severity } from '../entities/severity.enum';

@Injectable()
export class ViolationService {
  private readonly logger = new Logger(ViolationService.name);

  constructor(
    @InjectRepository(GovViolation)
    private readonly violationRepo: Repository<GovViolation>,
  ) {}

  async create(params: {
    policyId: string;
    entityType: string;
    entityId: string;
    violationDetail: string;
    severity: Severity;
  }): Promise<GovViolation> {
    const violation = this.violationRepo.create({
      ...params,
      status: ViolationStatus.OPEN,
    });
    const saved = await this.violationRepo.save(violation);
    this.logger.warn(`Violation created: ${saved.id} — policy: ${params.policyId} — severity: ${params.severity}`);
    return saved;
  }

  async findAll(filter?: { status?: string; severity?: string; policyId?: string }): Promise<GovViolation[]> {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.policyId) where.policyId = filter.policyId;
    return this.violationRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<GovViolation> {
    const violation = await this.violationRepo.findOne({ where: { id } });
    if (!violation) throw new NotFoundException(`Violation ${id} not found`);
    return violation;
  }

  async resolve(id: string, dto: ResolveViolationDto): Promise<GovViolation> {
    const violation = await this.findOne(id);
    violation.status = dto.status;
    if (dto.resolutionNotes) violation.resolutionNotes = dto.resolutionNotes;
    if (dto.assignedTo) violation.assignedTo = dto.assignedTo;

    if (dto.status === ViolationStatus.WAIVED) {
      if (!dto.waivedJustification) {
        throw new Error('Waived justification is required when waiving a violation');
      }
      violation.waivedJustification = dto.waivedJustification;
      if (dto.waiverExpiresAt) violation.waiverExpiresAt = new Date(dto.waiverExpiresAt);
    }

    if (dto.status === ViolationStatus.RESOLVED || dto.status === ViolationStatus.WAIVED) {
      violation.resolvedAt = new Date();
    }

    const updated = await this.violationRepo.save(violation);
    this.logger.log(`Violation resolved: ${id} — status: ${dto.status}`);
    return updated;
  }

  async assign(id: string, assigneeId: string): Promise<GovViolation> {
    const violation = await this.findOne(id);
    violation.assignedTo = assigneeId;
    violation.status = ViolationStatus.INVESTIGATING;
    const updated = await this.violationRepo.save(violation);
    this.logger.log(`Violation assigned: ${id} — to: ${assigneeId}`);
    return updated;
  }

  async getExpiredWaivers(): Promise<GovViolation[]> {
    return this.violationRepo.find({
      where: { status: ViolationStatus.WAIVED },
    }).then(violations =>
      violations.filter(v => v.waiverExpiresAt && new Date(v.waiverExpiresAt) < new Date()),
    );
  }
}
