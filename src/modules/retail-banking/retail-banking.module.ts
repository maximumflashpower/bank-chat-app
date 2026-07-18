import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetailAccount } from './entities/retail-account.entity';
import { RetailJointHolder } from './entities/retail-joint-holder.entity';
import { RetailDepositProduct } from './entities/retail-deposit-product.entity';
import { RetailTransferInstruction } from './entities/retail-transfer-instruction.entity';
import { RetailOverdraftEvent } from './entities/retail-overdraft-event.entity';
import { RetailAccountAlert } from './entities/retail-account-alert.entity';
import { RetailAccountService } from './services/retail-account.service';
import { DepositProductService } from './services/deposit-product.service';
import { TransferService } from './services/transfer.service';
import { OverdraftService } from './services/overdraft.service';
import { JointHolderService } from './services/joint-holder.service';
import { AlertService } from './services/alert.service';
import { AccountController } from './controllers/account.controller';
import { DepositProductController } from './controllers/deposit-product.controller';
import { TransferController } from './controllers/transfer.controller';
import { OverdraftController } from './controllers/overdraft.controller';
import { AlertController } from './controllers/alert.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetailAccount,
      RetailJointHolder,
      RetailDepositProduct,
      RetailTransferInstruction,
      RetailOverdraftEvent,
      RetailAccountAlert,
    ]),
  ],
  controllers: [
    AccountController,
    DepositProductController,
    TransferController,
    OverdraftController,
    AlertController,
  ],
  providers: [
    RetailAccountService,
    DepositProductService,
    TransferService,
    OverdraftService,
    JointHolderService,
    AlertService,
  ],
  exports: [
    TypeOrmModule,
    RetailAccountService,
    DepositProductService,
    TransferService,
    OverdraftService,
    JointHolderService,
    AlertService,
  ],
})
export class RetailBankingModule {}
