import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RegulatoryAuditPortalAccess } from '../entities/regulatory-audit-portal-access.entity';

@Injectable()
export class AuditPortalService {
  constructor(
    @InjectRepository(RegulatoryAuditPortalAccess)
    private auditPortalRepo: Repository<RegulatoryAuditPortalAccess>,
  ) {}

  async grantAccess(data: Partial<RegulatoryAuditPortalAccess>): Promise<RegulatoryAuditPortalAccess> {
    if (!data.accessScopes || data.accessScopes.length === 0) {
      throw new BadRequestException('At least one access scope is required');
    }
    if (!data.expiresAt) {
      throw new BadRequestException('Expiration date is required for auditor access');
    }
    const access = this.auditPortalRepo.create(data);
    return this.auditPortalRepo.save(access);
  }

  async findAllActive(): Promise<RegulatoryAuditPortalAccess[]> {
    return this.auditPortalRepo.find({ where: { isActive: true }, order: { expiresAt: 'ASC' } });
  }

  async findOne(id: string): Promise<RegulatoryAuditPortalAccess> {
    const access = await this.auditPortalRepo.findOne({ where: { id } });
    if (!access) {
      throw new NotFoundException(`Audit portal access ${id} not found`);
    }
    return access;
  }

  async revokeAccess(id: string): Promise<RegulatoryAuditPortalAccess> {
    await this.findOne(id);
    await this.auditPortalRepo.update(id, { isActive: false });
    return this.findOne(id);
  }

  async extendAccess(id: string, days: number): Promise<RegulatoryAuditPortalAccess> {
    const access = await this.findOne(id);
    const newExpiry = new Date(access.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + days);
    await this.auditPortalRepo.update(id, { expiresAt: newExpiry });
    return this.findOne(id);
  }

  async checkExpiringSoon(daysThreshold: number = 7): Promise<RegulatoryAuditPortalAccess[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    return this.auditPortalRepo.find({
      where: { isActive: true, expiresAt: LessThan(thresholdDate) },
      order: { expiresAt: 'ASC' },
    });
  }
}
