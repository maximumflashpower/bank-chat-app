import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './controllers/audit.controller';
import { ForensicController } from './controllers/forensic.controller';
import { SecurityEventController } from './controllers/security-event.controller';
import { AuditService } from './services/audit.service';
import { AuditAdvancedService } from './services/audit-advanced.service';
import { ForensicService } from './services/forensic.service';
import { SecurityEventService } from './services/security-event.service';
import { AuditLog } from './entities/audit-log.entity';
import { ForensicCase } from './entities/forensic-case.entity';
import { ForensicEvidenceItem } from './entities/forensic-evidence-item.entity';
import { SecurityEventClassified } from './entities/security-event-classified.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      ForensicCase,
      ForensicEvidenceItem,
      SecurityEventClassified,
    ]),
  ],
  controllers: [
    AuditController,
    ForensicController,
    SecurityEventController,
  ],
  providers: [
    AuditService,
    AuditAdvancedService,
    ForensicService,
    SecurityEventService,
  ],
  exports: [
    AuditService,
    AuditAdvancedService,
  ],
})
export class AuditModule {}
