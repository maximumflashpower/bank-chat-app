import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SecurityEventService } from '../services/security-event.service';
import { DetectAnomalyDto } from '../dto/detect-anomaly.dto';
import { ClassifyEventDto } from '../dto/classify-event.dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { SecurityEventCategory } from '../entities/security-event-category.enum';

@ApiTags('Security Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/security')
export class SecurityEventController {
  constructor(private readonly securityEventService: SecurityEventService) {}

  @Get('events')
  @ApiOperation({ summary: 'SEC-EVT-001: List security events' })
  async listEvents(@Body('category') category?: SecurityEventCategory) {
    return this.securityEventService.listEvents(category);
  }

  @Post('anomaly/detect')
  @ApiOperation({ summary: 'SEC-EVT-004: Detect anomaly / tampering attempt' })
  async detectAnomaly(@Body() dto: DetectAnomalyDto) {
    return this.securityEventService.detectAnomaly(dto);
  }

  @Put('event/:id/classify')
  @ApiOperation({ summary: 'SEC-EVT-002: Classify event as incident or false positive' })
  async classifyEvent(@Param('id') eventId: string, @Body() dto: ClassifyEventDto) {
    return this.securityEventService.classifyEvent(eventId, dto);
  }

  @Post('event/:id/mitre-map')
  @ApiOperation({ summary: 'SEC-EVT-003: Map event to MITRE ATT&CK' })
  async mapToMitre(@Param('id') eventId: string, @Body('techniqueId') techniqueId: string) {
    return this.securityEventService.mapToMitre(eventId, techniqueId);
  }

  @Post('event/:id/critical-alert')
  @ApiOperation({ summary: 'SEC-EVT-005: Trigger critical alert for tampering' })
  async triggerCriticalAlert(@Param('id') eventId: string) {
    return this.securityEventService.triggerCriticalAlert(eventId);
  }

  @Post('playbook/:category/trigger')
  @ApiOperation({ summary: 'SEC-EVT-007: Trigger incident response playbook' })
  async triggerPlaybook(@Param('category') category: SecurityEventCategory) {
    return this.securityEventService.triggerPlaybook(category);
  }

  @Post('evidence-package/compile')
  @ApiOperation({ summary: 'SEC-EVT-008: Compile regulatory evidence package' })
  async compileEvidencePackage(@Body() body: { start: string; end: string; regulation: string }) {
    return this.securityEventService.compileEvidencePackage(new Date(body.start), new Date(body.end), body.regulation);
  }

  @Post('retention/enforce')
  @ApiOperation({ summary: 'SEC-EVT-009: Enforce 7-year data retention policy' })
  async enforceRetention() {
    return this.securityEventService.enforceRetentionPolicy();
  }
}
