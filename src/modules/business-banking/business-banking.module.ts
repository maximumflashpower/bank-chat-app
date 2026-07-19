import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessAccount } from './entities/business-account.entity';
import { BusinessSignatory } from './entities/business-signatory.entity';
import { BusinessSweepRule } from './entities/business-sweep-rule.entity';
import { BusinessPositivePayRecord } from './entities/business-positive-pay-record.entity';
import { BusinessPayrollBatch } from './entities/business-payroll-batch.entity';
import { BusinessUboRegistration } from './entities/business-ubo-registration.entity';
import { BusinessAccountService } from './services/business-account.service';
import { SignatoryService } from './services/signatory.service';
import { SweepService } from './services/sweep.service';
import { PositivePayService } from './services/positive-pay.service';
import { PayrollService } from './services/payroll.service';
import { UboService } from './services/ubo.service';
import { AccountController } from './controllers/account.controller';
import { SignatoryController } from './controllers/signatory.controller';
import { SweepController } from './controllers/sweep.controller';
import { PositivePayController } from './controllers/positive-pay.controller';
import { PayrollController } from './controllers/payroll.controller';
import { UboController } from './controllers/ubo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessAccount,
      BusinessSignatory,
      BusinessSweepRule,
      BusinessPositivePayRecord,
      BusinessPayrollBatch,
      BusinessUboRegistration,
    ]),
  ],
  controllers: [
    AccountController,
    SignatoryController,
    SweepController,
    PositivePayController,
    PayrollController,
    UboController,
  ],
  providers: [
    BusinessAccountService,
    SignatoryService,
    SweepService,
    PositivePayService,
    PayrollService,
    UboService,
  ],
  exports: [
    BusinessAccountService,
    SignatoryService,
    SweepService,
  ],
})
export class BusinessBankingModule {}
