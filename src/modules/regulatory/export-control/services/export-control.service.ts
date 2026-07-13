import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportControlLicense } from '../entities/export-control-license.entity';
import { CheckExportLicenseDto } from '../dto/check-export-license.dto';
import { ExportControlStatus } from '../entities/export-control-status.enum';

@Injectable()
export class ExportControlService {
  private readonly logger = new Logger(ExportControlService.name);

  // Lista de países sancionados (ejemplo — en prod conectar a base de datos actualizada)
  private readonly sanctionedCountries = [
    'Cuba', 'Iran', 'North Korea', 'Syria', 'Crimea',
  ];

  // Clasificaciones restringidas de bienes de uso dual
  private readonly restrictedClassifications = [
    'EAR99', 'CCAT', 'AT.1', 'AT.2', 'MT-CAT',
  ];

  constructor(
    @InjectRepository(ExportControlLicense)
    private readonly licenseRepo: Repository<ExportControlLicense>,
  ) {}

  /**
   * REG-EXPORT-001: Verify export control license
   */
  async checkExportLicense(dto: CheckExportLicenseDto): Promise<ExportControlLicense> {
    // Check sanctioned countries
    const isSanctioned = this.sanctionedCountries.some(
      country => country.toLowerCase() === dto.destinationCountry.toLowerCase()
    );

    if (isSanctioned) {
      const license = Object.assign(new ExportControlLicense(), {
        licenseNumber: `DENIED-${Date.now()}`,
        exporterName: dto.exporterName,
        exporterCountry: dto.exporterCountry,
        destinationCountry: dto.destinationCountry,
        itemDescription: dto.itemDescription,
        classification: dto.classification,
        dualUseGoods: dto.dualUseGoods || false,
        status: ExportControlStatus.DENIED,
        denialReason: `Destination country ${dto.destinationCountry} is on sanctioned list`,
      });

      const saved = await this.licenseRepo.save(license) as unknown as ExportControlLicense;
      this.logger.warn(`Export DENIED - sanctioned country: ${dto.destinationCountry}`);
      return saved;
    }

    // Check dual-use goods
    if (dto.dualUseGoods) {
      const license = Object.assign(new ExportControlLicense(), {
        licenseNumber: `RESTRICTED-${Date.now()}`,
        exporterName: dto.exporterName,
        exporterCountry: dto.exporterCountry,
        destinationCountry: dto.destinationCountry,
        itemDescription: dto.itemDescription,
        classification: dto.classification,
        dualUseGoods: true,
        status: ExportControlStatus.RESTRICTED,
        denialReason: 'Dual-use goods require additional review',
      });

      const saved = await this.licenseRepo.save(license) as unknown as ExportControlLicense;
      this.logger.warn(`Export RESTRICTED - dual-use goods: ${dto.itemDescription}`);
      return saved;
    }

    // Approved
    const license = Object.assign(new ExportControlLicense(), {
      licenseNumber: `LICENSE-${Date.now()}`,
      exporterName: dto.exporterName,
      exporterCountry: dto.exporterCountry,
      destinationCountry: dto.destinationCountry,
      itemDescription: dto.itemDescription,
      classification: dto.classification,
      dualUseGoods: false,
      status: ExportControlStatus.APPROVED,
      approvalDate: new Date(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const saved = await this.licenseRepo.save(license) as unknown as ExportControlLicense;
    this.logger.log(`Export APPROVED: ${dto.exporterName} -> ${dto.destinationCountry}`);
    return saved;
  }

  /**
   * REG-EXPORT-002: Classify dual-use goods
   */
  async classifyGoods(itemDescription: string, classification: string): Promise<{
    isRestricted: boolean;
    requiresLicense: boolean;
    classification: string;
    recommendation: string;
  }> {
    const isRestricted = this.restrictedClassifications.includes(classification);
    const keywords = ['military', 'nuclear', 'chemical', 'biological', 'missile', 'encryption'];
    const descLower = itemDescription.toLowerCase();
    const hasKeywords = keywords.some(k => descLower.includes(k));

    return {
      isRestricted,
      requiresLicense: isRestricted || hasKeywords,
      classification,
      recommendation: isRestricted || hasKeywords
        ? 'Additional export license required before shipment'
        : 'Item classified as non-restricted, standard export permitted',
    };
  }

  /**
   * List all licenses
   */
  async findAll(status?: string): Promise<ExportControlLicense[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.licenseRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * Get single license
   */
  async findById(id: string): Promise<ExportControlLicense | null> {
    return this.licenseRepo.findOne({ where: { id } });
  }
}
