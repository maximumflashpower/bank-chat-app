import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './controllers/ledger.controller';
import { LedgerService } from './services/ledger.service';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction]),
    NotificationModule,
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
