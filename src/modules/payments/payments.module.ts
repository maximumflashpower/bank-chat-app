import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayInstruction } from './entities/pay-instruction.entity';
import { PayTransactionRecord } from './entities/pay-transaction-record.entity';
import { PayReconciliationEntry } from './entities/pay-reconciliation-entry.entity';
import { BankConnectionConfig } from './entities/bank-connection-config.entity';
import { PaymentInstructionService } from './services/payment-instruction.service';
import { PaymentReconciliationService } from './services/payment-reconciliation.service';
import { FxService } from './services/fx-service';
import { SanctionsScreeningService } from './services/sanctions-screening.service';
import { BankConnectionService } from './services/bank-connection.service';
import { PaymentsController } from './controllers/payments.controller';
import { ReconciliationController } from './controllers/reconciliation.controller';
import { FxController } from './controllers/fx.controller';
import { BankingController } from './controllers/banking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayInstruction,
      PayTransactionRecord,
      PayReconciliationEntry,
      BankConnectionConfig,
    ]),
  ],
  controllers: [
    PaymentsController,
    ReconciliationController,
    FxController,
    BankingController,
  ],
  providers: [
    PaymentInstructionService,
    PaymentReconciliationService,
    FxService,
    SanctionsScreeningService,
    BankConnectionService,
  ],
  exports: [
    PaymentInstructionService,
    PaymentReconciliationService,
    FxService,
    BankConnectionService,
  ],
})
export class PaymentsModule {}
