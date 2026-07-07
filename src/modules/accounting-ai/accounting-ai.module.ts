import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiOcrExtractionTask } from './entities/ai-ocr-extraction-task.entity';
import { AiJournalSuggestion } from './entities/ai-journal-suggestion.entity';
import { AiAnomalyDetectionResult } from './entities/ai-anomaly-detection-result.entity';
import { AiRecurringTemplate } from './entities/ai-recurring-template.entity';
import { CashflowClassificationLog } from './entities/cashflow-classification-log.entity';
import { OcrExtractionService } from './services/ocr-extraction.service';
import { JournalSuggestionService } from './services/journal-suggestion.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { MonthEndCloseService } from './services/month-end-close.service';
import { RecurringEntryService } from './services/recurring-entry.service';
import { CashflowClassificationService } from './services/cashflow-classification.service';
import { MlModelService } from './services/ml-model.service';
import { AccountingController } from './controllers/accounting.controller';
import { AnomalyController } from './controllers/anomaly.controller';
import { CloseController } from './controllers/close.controller';
import { CashflowController } from './controllers/cashflow.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiOcrExtractionTask,
      AiJournalSuggestion,
      AiAnomalyDetectionResult,
      AiRecurringTemplate,
      CashflowClassificationLog,
    ]),
  ],
  controllers: [
    AccountingController,
    AnomalyController,
    CloseController,
    CashflowController,
  ],
  providers: [
    OcrExtractionService,
    JournalSuggestionService,
    AnomalyDetectionService,
    MonthEndCloseService,
    RecurringEntryService,
    CashflowClassificationService,
    MlModelService,
  ],
  exports: [
    OcrExtractionService,
    JournalSuggestionService,
    AnomalyDetectionService,
    CashflowClassificationService,
  ],
})
export class AccountingAiModule {}
