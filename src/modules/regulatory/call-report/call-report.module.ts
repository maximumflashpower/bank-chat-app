import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryReport } from './entities/regulatory-report.entity';
import { CallReportService } from './services/call-report.service';
import { IntlReportingService } from './services/intl-reporting.service';
import { CallReportController } from './controllers/call-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegulatoryReport]),
  ],
  controllers: [CallReportController],
  providers: [CallReportService, IntlReportingService],
  exports: [CallReportService, IntlReportingService],
})
export class CallReportModule {}
