import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsolidationAcquisitionRegister, AcquisitionStatus } from '../entities/consolidation-acquisition-register.entity';
import { GoodwillService } from './goodwill.service';

@Injectable()
export class AcquisitionService {
  private readonly logger = new Logger(AcquisitionService.name);

  constructor(
    @InjectRepository(ConsolidationAcquisitionRegister)
    private readonly repo: Repository<ConsolidationAcquisitionRegister>,
    private readonly goodwillService: GoodwillService,
  ) {}

  async create(data: Partial<ConsolidationAcquisitionRegister>): Promise<ConsolidationAcquisitionRegister> {
    const code = data.acquisitionCode || `ACQ-${Date.now()}`;
    const acq = this.repo.create({
      ...data,
      acquisitionCode: code,
      status: AcquisitionStatus.ANNOUNCED,
      goodwillImpairment: 0,
      synergiesRealized: 0,
    });
    const saved = await this.repo.save(acq);
    this.logger.log(`Acquisition created: ${code} - ${saved.targetCompanyName}`);
    return saved;
  }

  async findById(id: string): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.repo.findOne({ where: { id } });
    if (!acq) throw new NotFoundException(`Acquisition ${id} not found`);
    return acq;
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: ConsolidationAcquisitionRegister[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async updateStatus(id: string, status: AcquisitionStatus): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.findById(id);
    acq.status = status;
    this.logger.log(`Acquisition ${acq.acquisitionCode} status → ${status}`);
    return this.repo.save(acq);
  }

  async performPurchasePriceAllocation(
    id: string,
    fairValueAssets: number,
    fairValueLiabilities: number,
  ): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.findById(id);
    acq.fairValueIdentifiableAssets = fairValueAssets;
    acq.fairValueIdentifiableLiabilities = fairValueLiabilities;
    acq.purchasePriceAllocationDate = new Date();
    await this.repo.save(acq);

    // Calcular goodwill automáticamente
    await this.goodwillService.calculateGoodwill(id);

    this.logger.log(`PPA completed for ${acq.acquisitionCode}`);
    return this.findById(id);
  }

  async recordSynergies(id: string, synergyAmount: number): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.findById(id);
    acq.synergiesRealized = Number(acq.synergiesRealized || 0) + synergyAmount;
    this.logger.log(`Synergies recorded for ${acq.acquisitionCode}: +${synergyAmount}`);
    return this.repo.save(acq);
  }

  async getAcquisitionsByStatus(status: AcquisitionStatus): Promise<ConsolidationAcquisitionRegister[]> {
    return this.repo.find({ where: { status }, order: { createdAt: 'DESC' } });
  }

  async terminate(id: string, reason: string): Promise<ConsolidationAcquisitionRegister> {
    const acq = await this.findById(id);
    acq.status = AcquisitionStatus.TERMINATED;
    acq.integrationStatus = `Terminated: ${reason}`;
    this.logger.warn(`Acquisition ${acq.acquisitionCode} terminated: ${reason}`);
    return this.repo.save(acq);
  }
}
