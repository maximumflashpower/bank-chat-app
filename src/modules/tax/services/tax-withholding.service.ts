import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TaxWithholdingCertificate } from '../entities/tax-withholding-certificate.entity';
import { CalculateWithholdingDto } from '../dto/calculate-withholding.dto';

@Injectable()
export class TaxWithholdingService {
  constructor(
    @InjectRepository(TaxWithholdingCertificate)
    private repo: Repository<TaxWithholdingCertificate>,
  ) {}

  async calculateAndIssue(dto: CalculateWithholdingDto): Promise<TaxWithholdingCertificate> {
    const rate = dto.withholdingRate ?? this.getDefaultRate(dto.withholdingType);
    const withholdingAmount = dto.grossAmount * rate;
    const netAmount = dto.grossAmount - withholdingAmount;

    const cert = this.repo.create({
      certificateNumber: `WH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      ...dto,
      withholdingRate: rate,
      withholdingAmount,
      netAmount,
      certifiedAt: new Date(),
    });

    return this.repo.save(cert);
  }

  private getDefaultRate(type: string): number {
    const rates: Record<string, number> = {
      services: 0.10,
      payroll: 0.20,
      rentals: 0.15,
      dividends: 0.30,
    };
    return rates[type] ?? 0.10;
  }

  async findById(id: string): Promise<TaxWithholdingCertificate | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByWithholdee(withholdeeId: string): Promise<TaxWithholdingCertificate[]> {
    return this.repo.find({ where: { withholdeeId }, order: { createdAt: 'DESC' } });
  }

  async findPendingCertificates(): Promise<TaxWithholdingCertificate[]> {
    return this.repo.find({ where: { certifiedAt: IsNull() } });
  }
}
