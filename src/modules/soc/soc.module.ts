import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocAlert } from './entities/soc-alert.entity';
import { SocIncident } from './entities/soc-incident.entity';
import { SoarPlaybook } from './entities/soar-playbook.entity';
import { SoarExecutionLog } from './entities/soar-execution-log.entity';
import { ThreatIntelFeed } from './entities/threat-intel-feed.entity';
import { IoCCache } from './entities/ioc-cache.entity';
import { VulnerabilityScanResult } from './entities/vulnerability-scan-result.entity';
import { SocDashboardService } from './services/soc-dashboard.service';
import { SoarPlaybookService } from './services/soar-playbook.service';
import { ThreatIntelService } from './services/threat-intel.service';
import { VulnerabilityService } from './services/vulnerability.service';
import { SocDashboardController } from './controllers/soc-dashboard.controller';
import { SoarPlaybookController } from './controllers/soar-playbook.controller';
import { ThreatIntelController } from './controllers/threat-intel.controller';
import { VulnerabilityController } from './controllers/vulnerability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocAlert,
      SocIncident,
      SoarPlaybook,
      SoarExecutionLog,
      ThreatIntelFeed,
      IoCCache,
      VulnerabilityScanResult,
    ]),
  ],
  controllers: [
    SocDashboardController,
    SoarPlaybookController,
    ThreatIntelController,
    VulnerabilityController,
  ],
  providers: [
    SocDashboardService,
    SoarPlaybookService,
    ThreatIntelService,
    VulnerabilityService,
  ],
  exports: [
    SocDashboardService,
    SoarPlaybookService,
    ThreatIntelService,
    VulnerabilityService,
  ],
})
export class SocModule {}
