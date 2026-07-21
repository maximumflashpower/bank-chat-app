import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModularityService } from '../services/modularity.service';

@ApiTags('Security AI/ML')
@Controller('v1/soc/modern')
export class ModularityController {
  constructor(private readonly modService: ModularityService) {}

  @Post('triage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI-powered alert triage with ML classifier' })
  @ApiResponse({ status: 200, description: 'Classification result' })
  async aiTriage(@Body() alertData: Record<string, unknown>) {
    return this.modService.aiAlertTriage(alertData);
  }

  @Post('threat-model')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Predictive threat modeling' })
  @ApiResponse({ status: 200, description: 'Risk prediction' })
  async predictiveThreat(@Body() attackSurface: string[]) {
    return this.modService.predictiveThreatModeling(attackSurface);
  }

  @Post('root-cause-suggest')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Automated incident root cause suggester' })
  @ApiResponse({ status: 200, description: 'Root causes' })
  async suggestRootCause(@Body() incidentData: Record<string, unknown>) {
    return this.modService.suggestRootCause(incidentData);
  }

  @Get('behavioral-biometrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Behavioral biometrics continuous authentication' })
  @ApiResponse({ status: 200, description: 'Risk assessment' })
  async behavioralBiometrics(@Query('userId') userId: string) {
    return this.modService.behavioralBiometrics(userId);
  }

  @Post('self-healing/mitigate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Self-healing security auto-mitigation' })
  @ApiResponse({ status: 200, description: 'Mitigation result' })
  async selfHealing(@Body() data: { threatType: string }) {
    return this.modService.selfHealingMitigation(data.threatType);
  }

  @Get('control-roi')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Security control effectiveness ROI calculator' })
  @ApiResponse({ status: 200, description: 'ROI metrics' })
  async securityROI() {
    return this.modService.calculateSecurityROI();
  }
}
