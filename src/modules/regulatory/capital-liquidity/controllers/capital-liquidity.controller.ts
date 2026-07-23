import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/guards/roles.guard';
import { Roles } from '../../../identity/decorators/roles.decorator';
import { RoleType } from '../../../identity/entities/role.enum';
import { CapitalService } from '../services/capital-service.service';
import { LiquidityService } from '../services/liquidity-service.service';
import { BaselCalculatorService } from '../services/basel-calculator.service';
import {
  CalculateCapitalRatioDto,
  CalculateLcrDto,
  CalculateNsfrDto,
  CalculateLeverageDto,
  CalculateStressedLcrDto,
  PerformIcaapDto,
  GeneratePillar3Dto,
  CalculateRwaDto,
} from '../dto/calculate-ratios.dto';

@ApiTags('Regulatory — Capital & Liquidity (Basel III)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regulatory/capital-liquidity')
export class CapitalLiquidityController {
  constructor(
    private readonly capitalService: CapitalService,
    private readonly liquidityService: LiquidityService,
    private readonly baselCalculatorService: BaselCalculatorService,
  ) {}

  // ═════════════════════════════════════════════════════════════
  // REG-CAP-001: Basel III Capital Ratios
  // ═════════════════════════════════════════════════════════════

  @Post('capital/ratio')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-CAP-001: Calculate Basel III Capital Ratio (CET1, Tier 1, Total)' })
  @ApiResponse({ status: 201, description: 'Capital ratio calculated successfully' })
  async calculateCapitalRatio(@Req() req: Request, @Body() dto: CalculateCapitalRatioDto) {
    const userId = (req.user as any)?.id;
    return this.capitalService.calculateCapitalRatio(
      dto.ratioType,
      dto.capitalAmount,
      dto.riskWeightedAssets,
      dto.reportingDate,
      userId,
      (dto as any).bufferBreakdown,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // REG-BUFFER-001: Capital Buffer Requirements
  // ═════════════════════════════════════════════════════════════

  @Post('capital/buffers')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-BUFFER-001: Calculate Capital Buffer Requirements (CCyB, G-SIB, D-SIB)' })
  @ApiResponse({ status: 201, description: 'Buffer requirements calculated successfully' })
  async calculateBufferRequirements(
    @Body() body: { capitalRatioId: string; ccybRate: number; gsibSurcharge?: number; dsibSurcharge?: number },
  ) {
    const capitalRatio = await this.capitalService.findById(body.capitalRatioId);
    return this.capitalService.calculateBufferRequirements(
      capitalRatio,
      body.ccybRate,
      body.gsibSurcharge,
      body.dsibSurcharge,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Capital Ratio Query Endpoints
  // ═════════════════════════════════════════════════════════════

  @Get('capital/latest')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get latest capital ratios' })
  async getLatestCapitalRatios() {
    return this.capitalService.getLatestRatios();
  }

  @Get('capital/adequacy')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'Get current capital adequacy status' })
  async getAdequacyStatus(@Query('date') date?: string) {
    const currentDate = date ? new Date(date) : new Date();
    return this.capitalService.getAdequacyStatus(currentDate);
  }

  @Get('capital/:id')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get capital ratio by ID' })
  async getCapitalRatioById(@Param('id') id: string) {
    return this.capitalService.findById(id);
  }

  @Get('capital')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get capital ratios by date range' })
  async getCapitalRatiosByRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.capitalService.findAllByDateRange(new Date(startDate), new Date(endDate));
  }

  // ═════════════════════════════════════════════════════════════
  // REG-LCR-001: Liquidity Coverage Ratio
  // ═════════════════════════════════════════════════════════════

  @Post('liquidity/lcr')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-LCR-001: Calculate Liquidity Coverage Ratio (LCR)' })
  @ApiResponse({ status: 201, description: 'LCR calculated successfully' })
  async calculateLCR(@Req() req: Request, @Body() dto: CalculateLcrDto) {
    const userId = (req.user as any)?.id;
    return this.liquidityService.calculateLCR(
      dto.hqlaAmount,
      dto.totalNetCashOutflows30d,
      dto.reportingDate,
      userId,
      (dto as any).hqlaComposition,
      (dto as any).inflowsBreakdown,
      (dto as any).outflowsBreakdown,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // REG-NSFR-001: Net Stable Funding Ratio
  // ═════════════════════════════════════════════════════════════

  @Post('liquidity/nsfr')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-NSFR-001: Calculate Net Stable Funding Ratio (NSFR)' })
  @ApiResponse({ status: 201, description: 'NSFR calculated successfully' })
  async calculateNSFR(@Req() req: Request, @Body() dto: CalculateNsfrDto) {
    const userId = (req.user as any)?.id;
    return this.liquidityService.calculateNSFR(
      dto.availableStableFunding,
      dto.requiredStableFunding,
      dto.reportingDate,
      userId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // REG-LVR-001: Leverage Ratio
  // ═════════════════════════════════════════════════════════════

  @Post('liquidity/leverage')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-LVR-001: Calculate Leverage Ratio' })
  @ApiResponse({ status: 201, description: 'Leverage ratio calculated successfully' })
  async calculateLeverageRatio(@Req() req: Request, @Body() dto: CalculateLeverageDto) {
    const userId = (req.user as any)?.id;
    return this.liquidityService.calculateLeverageRatio(
      dto.tier1Capital,
      dto.totalExposure,
      dto.reportingDate,
      userId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // REG-STRESS-CAP-001: Stressed LCR
  // ═════════════════════════════════════════════════════════════

  @Post('liquidity/stressed-lcr')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-STRESS-CAP-001: Calculate Stressed LCR (stress scenario)' })
  @ApiResponse({ status: 201, description: 'Stressed LCR calculated successfully' })
  async calculateStressedLCR(@Req() req: Request, @Body() dto: CalculateStressedLcrDto) {
    const userId = (req.user as any)?.id;
    return this.liquidityService.calculateStressedLCR(
      dto.baseHqlaAmount,
      dto.baseNetOutflows,
      dto.severity,
      dto.reportingDate,
      userId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Liquidity Ratio Query Endpoints
  // ═════════════════════════════════════════════════════════════

  @Get('liquidity/latest')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get latest liquidity ratios' })
  async getLatestLiquidityRatios() {
    return this.liquidityService.getLatestRatios();
  }

  @Get('liquidity/:id')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get liquidity ratio by ID' })
  async getLiquidityRatioById(@Param('id') id: string) {
    return this.liquidityService.findById(id);
  }

  @Get('liquidity')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get liquidity ratios by date range' })
  async getLiquidityRatiosByRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.liquidityService.findAllByDateRange(new Date(startDate), new Date(endDate));
  }

  // ═════════════════════════════════════════════════════════════
  // REG-ICAAP-001: Internal Capital Adequacy Assessment
  // ═════════════════════════════════════════════════════════════

  @Post('basel/icaap')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-ICAAP-001: Perform ICAAP Internal Capital Adequacy Assessment' })
  @ApiResponse({ status: 201, description: 'ICAAP performed successfully' })
  async performICAAP(@Req() req: Request, @Body() dto: PerformIcaapDto) {
    const userId = (req.user as any)?.id;
    return this.baselCalculatorService.performICAAP(
      dto.cet1Ratio,
      dto.tier1Ratio,
      dto.totalCapitalRatio,
      dto.leverageRatio,
      dto.projectedRwaGrowth,
      userId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // REG-PILLAR3-001: Pillar 3 Disclosure Report
  // ═════════════════════════════════════════════════════════════

  @Post('basel/pillar3')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'REG-PILLAR3-001: Generate Pillar 3 Disclosure Report' })
  @ApiResponse({ status: 201, description: 'Pillar 3 report generated successfully' })
  async generatePillar3Report(@Req() req: Request, @Body() dto: GeneratePillar3Dto) {
    const userId = (req.user as any)?.id;
    return this.baselCalculatorService.generatePillar3Report(
      dto.reportingDate,
      dto.frequency,
      userId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Utility: RWA Calculation
  // ═════════════════════════════════════════════════════════════

  @Post('basel/rwa')
  @Roles(RoleType.COMPLIANCE_OFFICER, RoleType.REGULATORY_ANALYST)
  @ApiOperation({ summary: 'Calculate Risk-Weighted Assets (RWA) from exposures' })
  @ApiResponse({ status: 201, description: 'RWA calculated successfully' })
  async calculateRWA(@Body() dto: CalculateRwaDto) {
    return this.baselCalculatorService.calculateRWA(dto.exposures);
  }
}
