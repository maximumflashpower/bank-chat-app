import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmbCompanyProfile } from './entities/smb-company-profile.entity';
import { SmbContactParty } from './entities/smb-contact-party.entity';
import { SmbInvoiceDocument } from './entities/smb-invoice-document.entity';
import { SmbBankAccountLinked } from './entities/smb-bank-account-linked.entity';
import { SmbSetupService } from './services/smb-setup.service';
import { SmbInvoiceService } from './services/smb-invoice.service';
import { SmbPaymentService } from './services/smb-payment.service';
import { SmbReceivableService } from './services/smb-receivable.service';
import { SmbBankingService } from './services/smb-banking.service';
import { SmbReportService } from './services/smb-report.service';
import { SmbController } from './controllers/smb.controller';
import { BankingController } from './controllers/banking.controller';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmbCompanyProfile,
      SmbContactParty,
      SmbInvoiceDocument,
      SmbBankAccountLinked,
    ]),
  ],
  controllers: [
    SmbController,
    BankingController,
    ReportsController,
  ],
  providers: [
    SmbSetupService,
    SmbInvoiceService,
    SmbPaymentService,
    SmbReceivableService,
    SmbBankingService,
    SmbReportService,
  ],
  exports: [
    SmbSetupService,
    SmbInvoiceService,
    SmbPaymentService,
    SmbBankingService,
    SmbReportService,
  ],
})
export class SmbModule {}
