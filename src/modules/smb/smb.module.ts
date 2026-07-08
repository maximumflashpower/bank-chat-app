import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmbCompanyProfile } from './entities/smb-company-profile.entity';
import { SmbContactParty } from './entities/smb-contact-party.entity';
import { SmbInvoiceDocument } from './entities/smb-invoice-document.entity';
import { SmbInvoiceLineItem } from './entities/smb-invoice-line-item.entity';
import { SmbInventoryModule } from '../smb-inventory/smb-inventory.module';
import { TaxModule } from '../tax/tax.module';
import { SmbBankAccountLinked } from './entities/smb-bank-account-linked.entity';
import { SmbSetupService } from './services/smb-setup.service';
import { SmbInvoiceService } from './services/smb-invoice.service';
import { SmbPaymentService } from './services/smb-payment.service';
import { SmbReceivableService } from './services/smb-receivable.service';
import { SmbBankingService } from './services/smb-banking.service';
import { SmbReportService } from './services/smb-report.service';
import { SmbInventoryInvoiceService } from './services/smb-inventory-invoice.service';
import { SmbController } from './controllers/smb.controller';
import { BankingController } from './controllers/banking.controller';
import { ReportsController } from './controllers/reports.controller';
import { SmbInventoryInvoiceController } from './controllers/smb-inventory-invoice.controller';

@Module({
  imports: [
    SmbInventoryModule,
    TaxModule,
    TypeOrmModule.forFeature([
      SmbCompanyProfile,
      SmbContactParty,
      SmbInvoiceDocument,
      SmbInvoiceLineItem,
      SmbBankAccountLinked,
    ]),
  ],
  controllers: [
    SmbController,
    BankingController,
    ReportsController,
    SmbInventoryInvoiceController,
  ],
  providers: [
    SmbSetupService,
    SmbInvoiceService,
    SmbPaymentService,
    SmbReceivableService,
    SmbBankingService,
    SmbReportService,
    SmbInventoryInvoiceService,
  ],
  exports: [
    SmbSetupService,
    SmbInvoiceService,
    SmbPaymentService,
    SmbBankingService,
    SmbReportService,
    SmbInventoryInvoiceService,
  ],
})
export class SmbModule {}
