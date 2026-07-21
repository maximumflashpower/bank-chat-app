import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrespondentBank } from './entities/correspondent-bank.entity';
import { NostroAccount } from './entities/nostro-account.entity';
import { NostroSuspenseItem } from './entities/nostro-suspense-item.entity';
import { NostroTransactionLog } from './entities/nostro-transaction-log.entity';
import { RemittanceInstruction } from './entities/remittance-instruction.entity';
import { SanctionsScreeningResult } from './entities/sanctions-screening-result.entity';
import { CorrespondentBankService } from './services/correspondent-bank.service';
import { CorrespondentComplianceService } from './services/correspondent-compliance.service';
import { NostroAccountService } from './services/nostro-account.service';
import { NostroReconciliationService } from './services/nostro-reconciliation.service';
import { RemittanceService } from './services/remittance.service';
import { SwiftGpiService } from './services/swift-gpi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorrespondentBank,
      NostroAccount,
      NostroSuspenseItem,
      NostroTransactionLog,
      RemittanceInstruction,
      SanctionsScreeningResult,
    ]),
  ],
  providers: [
    CorrespondentBankService,
    CorrespondentComplianceService,
    NostroAccountService,
    NostroReconciliationService,
    RemittanceService,
    SwiftGpiService,
  ],
  exports: [
    CorrespondentBankService,
    CorrespondentComplianceService,
    NostroAccountService,
    NostroReconciliationService,
    RemittanceService,
    SwiftGpiService,
  ],
})
export class CorrespondentModule {}
