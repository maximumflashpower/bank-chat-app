import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdPartyProcessor } from '../entities/third-party-processor.entity';
import { ProcessorAgreementStatus } from '../entities/processor-agreement-status.enum';
import { CreateThirdPartyProcessorDto } from '../dto/create-third-party-processor.dto';

/**
 * Servicio de gestión de procesadores de datos de terceros
 * Función: PRIV-MISC-004
 */
@Injectable()
export class ThirdPartyProcessorService {
  private readonly logger = new Logger(ThirdPartyProcessorService.name);

  constructor(
    @InjectRepository(ThirdPartyProcessor)
    private readonly repo: Repository<ThirdPartyProcessor>,
  ) {}

  async createProcessor(dto: CreateThirdPartyProcessorDto): Promise<ThirdPartyProcessor> {
    const processor = this.repo.create({
      processorName: dto.processorName,
      serviceType: dto.serviceType,
      dataCategories: dto.dataCategories,
      purpose: dto.purpose,
      transferCountries: dto.transferCountries || null,
      transferMechanism: dto.transferMechanism || null,
      agreementStatus: dto.agreementStatus || ProcessorAgreementStatus.ACTIVE,
      agreementDate: new Date(dto.agreementDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      documentRef: dto.documentRef || null,
    });

    const saved = await this.repo.save(processor);
    this.logger.log(`Procesador registrado: ${saved.processorName} (${saved.serviceType})`);
    return saved;
  }

  async listProcessors(activeOnly = false): Promise<ThirdPartyProcessor[]> {
    const where = activeOnly
      ? { agreementStatus: ProcessorAgreementStatus.ACTIVE }
      : {};
    return this.repo.find({ where, order: { agreementDate: 'DESC' } });
  }

  async getById(id: string): Promise<ThirdPartyProcessor> {
    const processor = await this.repo.findOne({ where: { id } });
    if (!processor) {
      throw new NotFoundException(`Procesador no encontrado: ${id}`);
    }
    return processor;
  }

  async updateProcessor(
    id: string,
    updates: Partial<CreateThirdPartyProcessorDto>,
  ): Promise<ThirdPartyProcessor> {
    const processor = await this.getById(id);
    Object.assign(processor, updates);
    return this.repo.save(processor);
  }

  async terminateAgreement(id: string): Promise<ThirdPartyProcessor> {
    const processor = await this.getById(id);
    processor.agreementStatus = ProcessorAgreementStatus.TERMINATED;
    this.logger.warn(`Acuerdo terminado: ${processor.processorName}`);
    return this.repo.save(processor);
  }

  async checkExpiringAgreements(daysAhead = 30): Promise<ThirdPartyProcessor[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysAhead);

    return this.repo
      .createQueryBuilder('p')
      .where('p.expiry_date IS NOT NULL')
      .andWhere('p.expiry_date <= :threshold', { threshold })
      .andWhere('p.agreement_status = :status', { status: ProcessorAgreementStatus.ACTIVE })
      .getMany();
  }

  async listCrossBorderTransfers(): Promise<ThirdPartyProcessor[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.transfer_countries IS NOT NULL')
      .andWhere("array_length(p.transfer_countries, 1) > 0")
      .andWhere('p.agreement_status = :status', { status: ProcessorAgreementStatus.ACTIVE })
      .getMany();
  }
}
