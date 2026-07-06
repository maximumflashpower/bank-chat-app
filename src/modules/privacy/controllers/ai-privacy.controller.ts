import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { AiPrivacyService } from '../services/ai-privacy.service';

@ApiTags('AI Privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/privacy/ai')
export class AiPrivacyController {
  constructor(
    private readonly aiService: AiPrivacyService,
  ) {}

  @Post('risk-assessment')
  @ApiOperation({ summary: 'AI Privacy Risk Assessment — stub/mock (PRIV-MOD-001)' })
  @ApiResponse({ status: 200, description: 'Evaluación de riesgo de privacidad' })
  async assessPrivacyRisk(
    @Body('processDataTypes') processDataTypes: string[],
    @Body('purposes') purposes: string[],
    @Body('dataSubjects') dataSubjects: string[],
    @Body('transferCountries') transferCountries?: string[],
    @Body('retentionPeriod') retentionPeriod?: string,
  ) {
    return this.aiService.assessPrivacyRisk({
      processDataTypes,
      purposes,
      dataSubjects,
      transferCountries,
      retentionPeriod,
    });
  }

  @Post('dsar-resolve')
  @ApiOperation({ summary: 'Automated DSAR Resolution NLP — stub/mock (PRIV-MOD-002)' })
  @ApiResponse({ status: 200, description: 'Análisis NLP de solicitud DSAR' })
  async autoResolveDsar(
    @Body('requestText') requestText: string,
    @Body('userId') userId: string,
  ) {
    return this.aiService.autoResolveDsar({ requestText, userId });
  }

  @Get('data-flow-map')
  @ApiOperation({ summary: 'Real-Time Data Flow Compliance Map — stub/mock (PRIV-MOD-003)' })
  @ApiResponse({ status: 200, description: 'Mapa de flujos de datos con estado de cumplimiento' })
  async getDataFlowMap() {
    return this.aiService.getDataFlowMap();
  }
}
