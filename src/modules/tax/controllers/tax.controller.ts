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
  async calculate(@Body() dto: CalculateTaxDto): Promise<any> {
    return this.calcService.calculate(dto);
  }

  @Get('rates')
  async getRates(@Query('country') country: string) {
    return this.jurisdictionService.findByCountry(country);
  }

  @Post('rates/create')
  
  async createRate(@Body() dto: CreateTaxRateDto): Promise<any> {
    return this.jurisdictionService.create(dto);
  }

  @Put('rates/:id')
  
  async updateRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto): Promise<any> {
    return this.jurisdictionService.update(id, dto);
  }

  @Get('exemptions')
  async getExemptions(@Query('customerId') customerId: string) {
    return customerId
      ? this.exemptionService.findByCustomer(customerId)
      : this.exemptionService.findAll();
  }

  @Post('exemptions')
  
  async createExemption(@User() user: any, @Body() dto: CreateExemptionDto): Promise<any> {
    return this.exemptionService.create({ ...dto, createdBy: user?.id });
  }

  @Post('report/fiscal-year')
  
  async fiscalYearReport(@Body() dto: FiscalYearReportDto): Promise<any> {
    return this.auditService.getAuditSummary(dto.countryCode, dto.fiscalYear);
  }

  @Get('trail/:declarationId')
  @Roles(RoleType.AUDITOR)
  async getDeclarationTrail(@Param('declarationId') declarationId: string): Promise<any> {
    return this.auditService.getDeclarationBreakdown(declarationId);
  }

  @Get('jurisdiction/rules')
  
  async getJurisdictionRules(@Query('country') country: string) {
    return this.jurisdictionService.findByCountry(country);
  }
}
