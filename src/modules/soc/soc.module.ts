import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocAlert } from './entities/soc-alert.entity';
import { SocIncident } from './entities/soc-incident.entity';
import { SoarPlaybook } from './entities/soar-playbook.entity';
import { SoarExecutionLog } from './entities/soar-execution-log.entity';
import { SocDashboardService } from './services/soc-dashboard.service';
import { SoarPlaybookService } from './services/soar-playbook.service';
import { SocDashboardController } from './controllers/soc-dashboard.controller';
import { SoarPlaybookController } from './controllers/soar-playbook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocAlert,
      SocIncident,
      SoarPlaybook,
      SoarExecutionLog,
    ]),
  ],
  controllers: [
    SocDashboardController,
    SoarPlaybookController,
  ],
  providers: [
    SocDashboardService,
    SoarPlaybookService,
  ],
  exports: [
    SocDashboardService,
    SoarPlaybookService,
  ],
})
export class SocModule {}
