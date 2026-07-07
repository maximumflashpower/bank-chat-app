import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { FlagFraudDto } from '../dto/flag-fraud.dto';

@Controller('api/v1/accounting/anomalies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnomalyController {
  constructor(
    private anomalyService: AnomalyDetectionService,
  ) {}

  @Get('detect')
  @Roles(RoleType.AUDITOR)
  async detectBatch(): Promise<any> {
    return this.anomalyService.listAll();
  }

  @Get('list')
  @Roles(RoleType.AUDITOR)
  async listAnomalies(): Promise<any[]> {
    return this.anomalyService.listAll();
  }

  @Post('anomaly/:id/flag-fraud')
  @Roles(RoleType.AUDITOR)
  async flagFraud(@Param('id') id: string, @Body() dto: FlagFraudDto): Promise<void> {
    await this.anomalyService.flagAsFraud(id, dto);
  }
}
