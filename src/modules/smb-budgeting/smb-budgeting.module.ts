import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetHeader } from './entities/budget-header.entity';
import { BudgetLineItem } from './entities/budget-line-item.entity';
import { ProjectRegistry } from './entities/project-registry.entity';
import { TimeEntryLog } from './entities/time-entry-log.entity';
import { OverheadAllocationMethod } from './entities/overhead-allocation-method.entity';
import { BudgetService } from './services/budget.service';
import { ProjectService } from './services/project.service';
import { TimeTrackingService } from './services/time-tracking.service';
import { KpiService } from './services/kpi.service';
import { AllocationService } from './services/allocation.service';
import { BudgetController } from './controllers/budget.controller';
import { ProjectController } from './controllers/project.controller';
import { AllocationController } from './controllers/allocation.controller';
import { KpiController } from './controllers/kpi.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BudgetHeader,
      BudgetLineItem,
      ProjectRegistry,
      TimeEntryLog,
      OverheadAllocationMethod,
    ]),
  ],
  controllers: [
    BudgetController,
    ProjectController,
    AllocationController,
    KpiController,
  ],
  providers: [
    BudgetService,
    ProjectService,
    TimeTrackingService,
    KpiService,
    AllocationService,
  ],
  exports: [
    BudgetService,
    ProjectService,
    TimeTrackingService,
    KpiService,
    AllocationService,
  ],
})
export class SmbBudgetingModule {}
