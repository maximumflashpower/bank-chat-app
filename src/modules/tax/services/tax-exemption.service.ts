import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxExemption, ExemptionStatus } from '../entities/tax-exemption.entity';
import { CreateExemptionDto } from '../dto/create-exemption.dto';

@Injectable()
export class TaxExemptionService {
  constructor(
    @InjectRepository(TaxExemption)
    private repo: Repository<TaxExemption>,
  ) {}

  async create(dto: Partial<CreateExemptionDto> & { createdBy: string }): Promise<TaxExemption> {
    const exemption = new TaxExemption();
    
    exemption.exemptionCode = `EXEMPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    exemption.certificateNumber = dto.certificateNumber ?? `CERT-${Date.now()}`;
    exemption.exemptionType = this.mapExemptionType(dto.exemptionType ?? 'other');
    exemption.entityId = dto.customerId ?? '';
    exemption.entityName = dto.reason ?? 'Unknown';
    exemption.jurisdictionId = dto.jurisdictionCode ?? '';
    exemption.issueDate = dto.validFrom ? new Date(dto.validFrom) : new Date();
    exemption.expirationDate = dto.validUntil ? new Date(dto.validUntil) : this.addYears(new Date(), 1);
    exemption.issuingAuthority = 'Automated System';
    exemption.coveragePercentage = 100;
    exemption.conditions = dto.notes ?? null;
    exemption.status = ExemptionStatus.PENDING;
    exemption.verified = false;
    exemption.createdBy = dto.createdBy;

    return await this.repo.save(exemption);
  }

  private mapExemptionType(type: string): any {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('NONPROFIT') || typeUpper.includes('NON_PROFIT')) return 'non_profit';
    if (typeUpper.includes('GOVERNMENT')) return 'government';
    if (typeUpper.includes('FOREIGN')) return 'foreign_entity';
    if (typeUpper.includes('INTERSTATE')) return 'interstate_sales';
    if (typeUpper.includes('RETAILER')) return 'retailer_exemption';
    if (typeUpper.includes('MANUFACTURER')) return 'manufacturer_exemption';
    return 'other';
  }

  private addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  async findAll(): Promise<TaxExemption[]> {
    return this.repo.find({ where: { status: ExemptionStatus.ACTIVE } });
  }

  async findById(id: string): Promise<TaxExemption | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEntity(entityId: string): Promise<TaxExemption[]> {
    return this.repo.find({ where: { entityId } });
  }

  async findByCustomer(customerId: string): Promise<TaxExemption[]> {
    return this.findByEntity(customerId);
  }

  async findByJurisdiction(jurisdictionId: string): Promise<TaxExemption[]> {
    return this.repo.find({ where: { jurisdictionId } });
  }

  async findByStatus(status: ExemptionStatus): Promise<TaxExemption[]> {
    return this.repo.find({ where: { status } });
  }

  async validateExemption(entityId: string, jurisdictionId?: string): Promise<boolean> {
    const now = new Date();
    const exemptions = await this.repo.find({
      where: {
        entityId,
        status: ExemptionStatus.ACTIVE,
        verified: true,
      },
    });

    if (exemptions.length === 0) return false;

    return exemptions.some(e => {
      const validFrom = e.issueDate <= now;
      const validUntil = !e.expirationDate || e.expirationDate >= now;
      const jurisdictionMatch = !jurisdictionId || e.jurisdictionId === jurisdictionId;
      return validFrom && validUntil && jurisdictionMatch;
    });
  }

  async activate(id: string): Promise<TaxExemption> {
    const exemption = await this.findById(id);
    if (!exemption) throw new NotFoundException(`Exemption ${id} not found`);
    
    exemption.status = ExemptionStatus.ACTIVE;
    return await this.repo.save(exemption);
  }

  async suspend(id: string, reason?: string): Promise<TaxExemption> {
    const exemption = await this.findById(id);
    if (!exemption) throw new NotFoundException(`Exemption ${id} not found`);
    
    exemption.status = ExemptionStatus.SUSPENDED;
    if (reason) exemption.notes = reason;
    return await this.repo.save(exemption);
  }

  async expire(id: string): Promise<TaxExemption> {
    const exemption = await this.findById(id);
    if (!exemption) throw new NotFoundException(`Exemption ${id} not found`);
    
    exemption.status = ExemptionStatus.EXPIRED;
    return await this.repo.save(exemption);
  }

  async verify(id: string, verifiedBy: string): Promise<TaxExemption> {
    const exemption = await this.findById(id);
    if (!exemption) throw new NotFoundException(`Exemption ${id} not found`);
    
    exemption.verified = true;
    exemption.verifiedBy = verifiedBy;
    exemption.verifiedAt = new Date();
    return await this.repo.save(exemption);
  }

  async reject(id: string, reason: string): Promise<TaxExemption> {
    const exemption = await this.findById(id);
    if (!exemption) throw new NotFoundException(`Exemption ${id} not found`);
    
    exemption.status = ExemptionStatus.DENIED;
    exemption.notes = reason;
    return await this.repo.save(exemption);
  }
}
