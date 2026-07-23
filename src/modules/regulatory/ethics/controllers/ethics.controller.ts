import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
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
import { EthicsService } from '../services/ethics.service';
import { SubmitWhistleblowerDto } from '../dto/submit-whistleblower.dto';
import { DeclareCoiDto } from '../dto/declare-coi.dto';
import { LogGiftDto } from '../dto/log-gift.dto';
import { ReviewCoiDto } from '../dto/review-coi.dto';
import { ApproveGiftDto } from '../dto/approve-gift.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';
import { EthicsCaseType } from '../entities/ethics-case-type.enum';

@ApiTags('Ethics & Compliance')
@Controller('regulatory/ethics')
export class EthicsController {
  constructor(private readonly ethicsService: EthicsService) {}

  // ── WHISTLEBLOWER ──

  @Post('whistleblower/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar denuncia anónima (canal abierto)' })
  async submitWhistleblower(@Body() dto: SubmitWhistleblowerDto): Promise<any> {
    return this.ethicsService.submitWhistleblower(dto);
  }

  @Put('whistleblower/:caseId/protect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proteger identidad del denunciante' })
  async protectIdentity(@Param('caseId') caseId: string): Promise<any> {
    return this.ethicsService.protectIdentity(caseId);
  }

  @Get('whistleblower/:caseId/deadline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de deadline de investigación' })
  async getDeadlineStatus(@Param('caseId') caseId: string): Promise<any> {
    return this.ethicsService.getDeadlineStatus(caseId);
  }

  @Put('whistleblower/:caseId/reward-assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluar elegibilidad de recompensa' })
  async assessRewardEligability(
    @Param('caseId') caseId: string,
    @Body('assessment') assessment: string,
  ): Promise<any> {
    return this.ethicsService.assessRewardEligibility(caseId, assessment);
  }

  @Get('whistleblower')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las denuncias' })
  async listWhistleblowerCases(): Promise<any> {
    return this.ethicsService.findCasesByType(EthicsCaseType.WHISTLEBLOWER);
  }

  // ── CONFLICT OF INTEREST ──

  @Post('coi/declare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Declarar conflicto de interés anual obligatorio' })
  async declareCoi(@Request() req: any, @Body() dto: DeclareCoiDto): Promise<any> {
    dto.employeeId = req.user?.id || dto.employeeId;
    return this.ethicsService.declareCoi(dto);
  }

  @Put('coi/:coiId/screen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Screening automático contra base de datos de vendors' })
  async screenCoi(
    @Param('coiId') coiId: string,
    @Body() body: { vendorDatabase: string[] },
  ): Promise<any> {
    return this.ethicsService.screenCoiAgainstVendors(coiId, body.vendorDatabase);
  }

  @Put('coi/:coiId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revisar COI con plan de mitigación' })
  async reviewCoi(
    @Param('coiId') coiId: string,
    @Body() dto: ReviewCoiDto,
  ): Promise<any> {
    return this.ethicsService.reviewCoi(dto);
  }

  @Get('coi/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista de COI pendientes de revisión' })
  async listPendingCoi(): Promise<any> {
    const allCoi = await this.ethicsService.findAllCoi();
    return allCoi.filter(c => c.approvalStatus === 'pending');
  }

  // ── GIFTS & ENTERTAINMENT ──

  @Post('gifts/log')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar gift/entretenimiento' })
  async logGift(@Request() req: any, @Body() dto: LogGiftDto): Promise<any> {
    dto.employeeId = req.user?.id || dto.employeeId;
    return this.ethicsService.logGift(dto);
  }

  @Post('gifts/flag-above')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar regalos por encima del umbral' })
  async flagGifts(@Body('threshold') threshold: number): Promise<any> {
    return this.ethicsService.flagGiftsAboveThreshold(threshold);
  }

  @Put('gifts/:giftId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar/rechazar gift' })
  async approveGift(
    @Param('giftId') giftId: string,
    @Request() req: any,
    @Body() dto: ApproveGiftDto,
  ): Promise<any> {
    const approverId = req.user?.id || 'system';
    return this.ethicsService.approveGift(giftId, approverId, dto);
  }

  @Get('gifts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar gifts del empleado' })
  @ApiQuery({ name: 'employeeId', required: false })
  async listGifts(@Query('employeeId') employeeId?: string): Promise<any> {
    return this.ethicsService.findAllGifts(employeeId);
  }

  // ── REPORTS ──

  @Get('reports/political-contributions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reporte de contribuciones políticas' })
  async listPoliticalContributions(): Promise<any> {
    return this.ethicsService.generatePoliticalContributionsReport();
  }

  // ── GENERIC LISTING ──

  @Get('cases')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los casos de ética' })
  async listAllCases(): Promise<any> {
    return this.ethicsService.findAllCases();
  }
}
