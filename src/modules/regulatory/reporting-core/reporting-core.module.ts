import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryLineage } from './entities/regulatory-lineage.entity';
import { ReportingCalendar } from './entities/reporting-calendar.entity';
import { ReportingCategory } from './entities/reporting-category.entity';
import { ValidationRule } from './entities/validation-rule.entity';
import { LineageService } from './services/lineage.service';
import { ValidationService } from './services/validation.service';
import { DashboardService } from './services/dashboard.service';
import { CalendarService } from './services/calendar.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegulatoryLineage,
      ReportingCalendar,
      ReportingCategory,
      ValidationRule,
    ]),
  ],
  providers: [
    LineageService,
    ValidationService,
    DashboardService,
    CalendarService,
  ],
  exports: [
    LineageService,
    ValidationService,
    DashboardService,
    CalendarService,
  ],
})
export class ReportingCoreModule {}
