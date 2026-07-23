import {
  Controller,
  Get,
  Post,
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
import { BaselReportingService } from '../services/basel-reporting.service';
import { GenerateBaselReportDto } from '../dto/generate-basel-report.dto';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';

@ApiTags('Basel III Reporting')
@Controller('regulatory/basel')
export class BaselController {
  constructor(private readonly baselService: BaselReportingService) {}

  /**
   * REG-BASEL-001: Capital Adequacy Report
   */
  @Post('capital-adequacy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar reporte de suficiencia de capital Basel III' })
  async generateCapitalAdequacy(@Body() dto: GenerateBaselReportDto): Promise<any> {
    return this.baselService.generateCapitalAdequacyReport(dto);
  }

  /**
   * REG-BASEL-002: Liquidity Coverage Ratio (LCR)
   */
  @Post('lcr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar Liquidity Coverage Ratio report' })
  async generateLcr(
    @Body() body: { highQualityLiquidAssets: number; netCashOutflows: number; quarter: number; year: number },
  ): Promise<any> {
    return this.baselService.generateLcrReport(body.highQualityLiquidAssets, body.netCashOutflows, body.quarter, body.year);
  }

  /**
   * REG-BASEL-003: Net Stable Funding Ratio (NSFR)
   */
  @Post('nsfr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar Net Stable Funding Ratio report' })
  async generateNsfr(
    @Body() body: { availableStableFunding: number; requiredStableFunding: number; quarter: number; year: number },
  ): Promise<any> {
    return this.baselService.generateNsfrReport(body.availableStableFunding, body.requiredStableFunding, body.quarter, body.year);
  }

  /**
   * REG-BASEL-004: Leverage Ratio
   */
  @Post('leverage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Monitoreo de Leverage Ratio' })
  async generateLeverage(
    @Body() body: { tier1Capital: number; totalExposure: number; quarter: number; year: number },
  ): Promise<any> {
    return this.baselService.generateLeverageReport(body.tier1Capital, body.totalExposure, body.quarter, body.year);
  }

  /**
   * List all Basel reports
   */
  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los reports Basel' })
  @ApiQuery({ name: 'reportType', required: false })
  @ApiQuery({ name: 'year', required: false })
  async findAll(
    @Query('reportType') reportType?: string,
    @Query('year') year?: string,
  ): Promise<any> {
    return this.baselService.findAll(reportType, year ? parseInt(year, 10) : undefined);
  }

  /**
   * Get single report
   */
  @Get('reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de reporte Basel específico' })
  async findById(@Param('id') id: string): Promise<any> {
    const report = await this.baselService.findById(id);
    if (!report) {
      return { error: 'Reporte no encontrado' };
    }
    return report;
  }
}
