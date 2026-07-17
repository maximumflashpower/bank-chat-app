import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxCalculationResult } from './entities/tax-calculation-result.entity';
import { TaxJurisdictionRule } from './entities/tax-jurisdiction-rule.entity';
import { TaxDeclarationPeriod } from './entities/tax-declaration-period.entity';
import { TaxWithholdingCertificate } from './entities/tax-withholding-certificate.entity';
import { TaxProductMapping } from './entities/tax-product-mapping.entity';
import { TaxExemption } from './entities/tax-exemption.entity';
import { TaxNexus } from './entities/tax-nexus.entity';
import { InventoryTaxLine } from './entities/inventory-tax-line.entity';
import { TaxCalculationService } from './services/tax-calculation.service';
import { TaxJurisdictionService } from './services/tax-jurisdiction.service';
import { TaxDeclarationService } from './services/tax-declaration.service';
import { TaxWithholdingService } from './services/tax-withholding.service';
import { TaxExemptionService } from './services/tax-exemption.service';
import { TaxProductMappingService } from './services/tax-product-mapping.service';
import { TaxNexusService } from './services/tax-nexus.service';
import { TaxAuditService } from './services/tax-audit.service';
import { TaxRegulatoryService } from './services/tax-regulatory.service';
import { InventoryTaxService } from './services/inventory-tax.service';
import { TaxController } from './controllers/tax.controller';
import { DeclarationController } from './controllers/declaration.controller';
import { WithholdingController } from './controllers/withholding.controller';
import { NexusController } from './controllers/nexus.controller';
import { InventoryTaxController } from './controllers/inventory-tax.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaxCalculationResult,
      TaxJurisdictionRule,
      TaxDeclarationPeriod,
      TaxWithholdingCertificate,
      TaxProductMapping,
      TaxExemption,
      TaxNexus,
      InventoryTaxLine,
    ]),
  ],
  controllers: [
    TaxController,
    DeclarationController,
    WithholdingController,
    NexusController,
    InventoryTaxController,
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
    InventoryTaxService,
  ],
  exports: [
    TaxCalculationService,
    TaxJurisdictionService,
    TaxDeclarationService,
    TaxWithholdingService,
    InventoryTaxService,
  ],
})
export class TaxModule {}
