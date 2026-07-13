import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocAlert } from './entities/soc-alert.entity';
import { SocIncident } from './entities/soc-incident.entity';
import { SoarPlaybook } from './entities/soar-playbook.entity';
import { SoarExecutionLog } from './entities/soar-execution-log.entity';
import { ThreatIntelFeed } from './entities/threat-intel-feed.entity';
import { IoCCache } from './entities/ioc-cache.entity';
import { SocDashboardService } from './services/soc-dashboard.service';
import { SoarPlaybookService } from './services/soar-playbook.service';
import { ThreatIntelService } from './services/threat-intel.service';
import { SocDashboardController } from './controllers/soc-dashboard.controller';
import { SoarPlaybookController } from './controllers/soar-playbook.controller';
import { ThreatIntelController } from './controllers/threat-intel.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocAlert,
      SocIncident,
      SoarPlaybook,
      SoarExecutionLog,
      ThreatIntelFeed,
      IoCCache,
    ]),
  ],
  controllers: [
    SocDashboardController,
    SoarPlaybookController,
    ThreatIntelController,
  ],
  providers: [
    SocDashboardService,
    SoarPlaybookService,
    ThreatIntelService,
  ],
  exports: [
    SocDashboardService,
    SoarPlaybookService,
    ThreatIntelService,
  ],
})
export class SocModule {}
