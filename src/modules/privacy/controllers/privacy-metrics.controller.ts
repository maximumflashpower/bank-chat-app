import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { PrivacyMetricsService } from '../services/privacy-metrics.service';

@ApiTags('Privacy Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy/metrics')
export class PrivacyMetricsController {
  constructor(
    private readonly metricsService: PrivacyMetricsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de métricas de privacidad para DPO (PRIV-MISC-003)' })
  @ApiResponse({ status: 200, description: 'Dashboard agregado con métricas de privacidad' })
  async getDashboard() {
    return this.metricsService.getDashboard();
  }
}
