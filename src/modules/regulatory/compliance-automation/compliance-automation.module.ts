import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegulatoryFramework } from './entities/regulatory-framework.entity';
import { RegulatoryControlTest } from './entities/regulatory-control-test.entity';
import { RegulatoryAuditPortalAccess } from './entities/regulatory-audit-portal-access.entity';
import { FrameworkService } from './services/framework.service';
import { ControlTestService } from './services/control-test.service';
import { AuditPortalService } from './services/audit-portal.service';
import { ComplianceAutomationController } from './controllers/compliance-automation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegulatoryFramework,
      RegulatoryControlTest,
      RegulatoryAuditPortalAccess,
    ]),
  ],
  providers: [
    FrameworkService,
    ControlTestService,
    AuditPortalService,
  ],
  controllers: [ComplianceAutomationController],
  exports: [
    FrameworkService,
    ControlTestService,
    AuditPortalService,
  ],
})
export class ComplianceAutomationModule {}
