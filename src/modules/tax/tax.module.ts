import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxCalculationResult } from './entities/tax-calculation-result.entity';
import { TaxJurisdictionRule } from './entities/tax-jurisdiction-rule.entity';
import { TaxDeclarationPeriod } from './entities/tax-declaration-period.entity';
import { TaxWithholdingCertificate } from './entities/tax-withholding-certificate.entity';
import { TaxProductMapping } from './entities/tax-product-mapping.entity';
import { TaxCalculationService } from './services/tax-calculation.service';
import { TaxJurisdictionService } from './services/tax-jurisdiction.service';
import { TaxDeclarationService } from './services/tax-declaration.service';
import { TaxWithholdingService } from './services/tax-withholding.service';
import { TaxExemptionService } from './services/tax-exemption.service';
import { TaxProductMappingService } from './services/tax-product-mapping.service';
import { TaxNexusService } from './services/tax-nexus.service';
import { TaxAuditService } from './services/tax-audit.service';
import { TaxRegulatoryService } from './services/tax-regulatory.service';
import { TaxController } from './controllers/tax.controller';
import { DeclarationController } from './controllers/declaration.controller';
import { WithholdingController } from './controllers/withholding.controller';
import { NexusController } from './controllers/nexus.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaxCalculationResult,
      TaxJurisdictionRule,
      TaxDeclarationPeriod,
      TaxWithholdingCertificate,
      TaxProductMapping,
    ]),
  ],
  controllers: [
    TaxController,
    DeclarationController,
    WithholdingController,
    NexusController,
  ],
  providers: [
    TaxCalculationService,
    TaxJurisdictionService,
    TaxDeclarationService,
    TaxWithholdingService,
    TaxExemptionService,
    TaxProductMappingService,
    TaxNexusService,
    TaxAuditService,
    TaxRegulatoryService,
  ],
  exports: [
    TaxCalculationService,
    TaxJurisdictionService,
    TaxDeclarationService,
    TaxWithholdingService,
  ],
})
export class TaxModule {}
