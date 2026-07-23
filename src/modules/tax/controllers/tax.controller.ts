import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { User } from '../../identity/decorators/user.decorator';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { TaxCalculationService } from '../services/tax-calculation.service';
import { TaxJurisdictionService } from '../services/tax-jurisdiction.service';
import { TaxExemptionService } from '../services/tax-exemption.service';
import { TaxAuditService } from '../services/tax-audit.service';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';
import { CreateTaxRateDto } from '../dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from '../dto/update-tax-rate.dto';
import { CreateExemptionDto } from '../dto/create-exemption.dto';
import { FiscalYearReportDto } from '../dto/fiscal-year-report.dto';

@ApiTags('Tax')
@Controller('v1/tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxController {
  constructor(
    private calcService: TaxCalculationService,
    private jurisdictionService: TaxJurisdictionService,
    private exemptionService: TaxExemptionService,
    private auditService: TaxAuditService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate tax for a transaction' })
  @ApiResponse({ status: 200, description: 'Tax calculation result' })
  async calculate(@Body() dto: CalculateTaxDto): Promise<any> {
    return this.calcService.calculate(dto);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get tax rates by country' })
  @ApiResponse({ status: 200, description: 'Tax rates for the specified country' })
  async getRates(@Query('country') country: string) {
    return this.jurisdictionService.findByCountry(country);
  }

  @Post('rates/create')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new tax rate' })
  @ApiResponse({ status: 201, description: 'Tax rate created successfully' })
  async createRate(@Body() dto: CreateTaxRateDto): Promise<any> {
    return this.jurisdictionService.create(dto);
  }

  @Put('rates/:id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Update an existing tax rate' })
  @ApiResponse({ status: 200, description: 'Tax rate updated successfully' })
  async updateRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto): Promise<any> {
    return this.jurisdictionService.update(id, dto);
  }

  @Get('exemptions')
  @ApiOperation({ summary: 'Get tax exemptions by customer or all' })
  @ApiResponse({ status: 200, description: 'List of tax exemptions' })
  async getExemptions(@Query('customerId') customerId: string) {
    return customerId
      ? this.exemptionService.findByCustomer(customerId)
      : this.exemptionService.findAll();
  }

  @Post('exemptions')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new tax exemption' })
  @ApiResponse({ status: 201, description: 'Tax exemption created successfully' })
  async createExemption(@User() user: any, @Body() dto: CreateExemptionDto): Promise<any> {
    return this.exemptionService.create({ ...dto, createdBy: user?.id });
  }

  @Post('report/fiscal-year')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Generate fiscal year tax report' })
  @ApiResponse({ status: 200, description: 'Fiscal year tax audit summary' })
  async fiscalYearReport(@Body() dto: FiscalYearReportDto): Promise<any> {
    return this.auditService.getAuditSummary(dto.countryCode, dto.fiscalYear);
  }

  @Get('trail/:declarationId')
  @Roles(RoleType.AUDITOR)
  @ApiOperation({ summary: 'Get tax declaration trail breakdown' })
  @ApiResponse({ status: 200, description: 'Declaration breakdown details' })
  async getDeclarationTrail(@Param('declarationId') declarationId: string): Promise<any> {
    return this.auditService.getDeclarationBreakdown(declarationId);
  }

  @Get('jurisdiction/rules')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Get jurisdiction tax rules by country' })
  @ApiResponse({ status: 200, description: 'Jurisdiction tax rules' })
  async getJurisdictionRules(@Query('country') country: string) {
    return this.jurisdictionService.findByCountry(country);
  }
}
