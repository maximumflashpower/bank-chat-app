import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateExemptionDto } from '../dto/create-exemption.dto';

export interface ExemptionRecord {
  id: string;
  customerId: string;
  exemptionType: string;
  reason?: string;
  validFrom?: Date;
  validUntil?: Date;
  certificateNumber?: string;
  jurisdictionCode?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exemptionStore: ExemptionRecord[] = [];

@Injectable()
export class TaxExemptionService {
  async create(dto: CreateExemptionDto): Promise<ExemptionRecord> {
    const record: ExemptionRecord = {
      id: crypto.randomUUID(),
      ...dto,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    exemptionStore.push(record);
    return record;
  }

  async findAll(): Promise<ExemptionRecord[]> {
    return exemptionStore.filter(e => e.active);
  }

  async findByCustomer(customerId: string): Promise<ExemptionRecord[]> {
    return exemptionStore.filter(e => e.customerId === customerId && e.active);
  }

  async validateExemption(customerId: string, jurisdictionCode?: string): Promise<boolean> {
    const now = new Date();
    return exemptionStore.some(e =>
      e.customerId === customerId &&
      e.active &&
      (!e.validUntil || e.validUntil >= now) &&
      (!jurisdictionCode || !e.jurisdictionCode || e.jurisdictionCode === jurisdictionCode)
    );
  }

  async deactivate(id: string): Promise<void> {
    const record = exemptionStore.find(e => e.id === id);
    if (!record) throw new NotFoundException(`Exemption ${id} not found`);
    record.active = false;
    record.updatedAt = new Date();
  }
}
