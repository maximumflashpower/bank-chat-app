import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MarketSurveillanceService } from '../services/market-surveillance.service';
import { CreateSurveillanceAlertDto } from '../dto/create-surveillance-alert.dto';
import { InvestigateAlertDto } from '../dto/investigate-alert.dto';
import { MifidTransactionReportDto } from '../dto/mifid-transaction-report.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('Market Surveillance')
@Controller('api/regulatory/surveillance')
export class SurveillanceController {
  constructor(private readonly surveillanceService: MarketSurveillanceService) {}

  /**
   * REG-SURVEILL-001: Create alert manually
   */
  @Post('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear alerta de surveillance manualmente' })
  async createAlert(@Body() dto: CreateSurveillanceAlertDto): Promise<any> {
    return this.surveillanceService.createAlert(dto);
  }

  /**
   * REG-SURVEILL-001: List all alerts
   */
  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar alertas de surveillance' })
  @ApiQuery({ name: 'alertType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'traderId', required: false })
  async findAll(
    @Query('alertType') alertType?: string,
    @Query('status') status?: string,
    @Query('traderId') traderId?: string,
  ): Promise<any> {
    return this.surveillanceService.findAll(alertType, status, traderId);
  }

  /**
   * REG-SURVEILL-001: Get single alert
   */
  @Get('alerts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de alerta específica' })
  async findById(@Param('id') id: string): Promise<any> {
    const alert = await this.surveillanceService.findById(id);
    if (!alert) {
      return { error: 'Alerta no encontrada' };
    }
    return alert;
  }

  /**
   * REG-SURVEILL-002/003/004/005/006: Run detection engine
   */
  @Post('detect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.AUDITOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar motor de detección sobre transacciones' })
  async runDetection(@Body() body: { transactions: any[]; eventType?: string }): Promise<any> {
    const results = [];

    const washTrade = await this.surveillanceService.detectWashTrade(body.transactions);
    if (washTrade) results.push(washTrade);

    const spoofing = await this.surveillanceService.detectSpoofing(body.transactions);
    if (spoofing) results.push(spoofing);

    const layering = await this.surveillanceService.detectLayering(body.transactions);
    if (layering) results.push(layering);

    const frontRunning = await this.surveillanceService.detectFrontRunning(body.transactions);
    if (frontRunning) results.push(frontRunning);

    const insider = await this.surveillanceService.detectInsiderDealing(body.transactions);
    if (insider) results.push(insider);

    return { alertsDetected: results.length, alerts: results };
  }

  /**
   * REG-SURVEILL-007: MiFID II transaction report
   */
  @Post('mifid-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar reporte MiFID II' })
  async generateMifidReport(@Body() dto: MifidTransactionReportDto): Promise<any> {
    return this.surveillanceService.generateMifidReport(
      new Date(dto.fromDate),
      new Date(dto.toDate),
      dto.instrumentSymbol,
    );
  }

  /**
   * REG-SURVEILL-008: Archive communications
   */
  @Post('communications/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archivar comunicaciones (retención 5 años)' })
  async archiveCommunications(@Body() body: { communications: any[] }): Promise<any> {
    return this.surveillanceService.archiveCommunications(body.communications);
  }

  /**
   * REG-SURVEILL-009: Trade reconstruction
   */
  @Get('alerts/:id/reconstruct')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reconstrucción timeline de eventos' })
  async reconstructTrade(@Param('id') id: string): Promise<any> {
    return this.surveillanceService.reconstructTrade(id);
  }

  /**
   * REG-SURVEILL-010: Investigate alert (case management)
   */
  @Put('alerts/:id/investigate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar investigación de alerta' })
  async investigateAlert(
    @Param('id') id: string,
    @Body() dto: InvestigateAlertDto,
  ): Promise<any> {
    return this.surveillanceService.investigateAlert(id, dto);
  }
}
