import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LetterOfCredit } from './entities/letter-of-credit.entity';
import { BankGuarantee } from './entities/bank-guarantee.entity';
import { DocumentExamination } from './entities/document-examination.entity';
import { LCAmendment } from './entities/lc-amendment.entity';
import { LetterOfCreditService } from './services/letter-of-credit.service';
import { BankGuaranteeService } from './services/bank-guarantee.service';
import { DocumentExaminationService } from './services/document-examination.service';
import { LetterOfCreditController } from './controllers/letter-of-credit.controller';
import { BankGuaranteeController } from './controllers/bank-guarantee.controller';
import { DocumentExaminationController } from './controllers/document-examination.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LetterOfCredit,
      BankGuarantee,
      DocumentExamination,
      LCAmendment,
    ]),
  ],
  controllers: [
    LetterOfCreditController,
    BankGuaranteeController,
    DocumentExaminationController,
  ],
  providers: [
    LetterOfCreditService,
    BankGuaranteeService,
    DocumentExaminationService,
  ],
  exports: [
    LetterOfCreditService,
    BankGuaranteeService,
    DocumentExaminationService,
  ],
})
export class TradeModule {}
