import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CorrespondentBankService } from '../services/correspondent-bank.service';
import { CreateCorrespondentDto } from '../dto/create-correspondent.dto';
import { UpdateCorrespondentDto } from '../dto/update-correspondent.dto';

@ApiTags('correspondent')
@Controller('api/v1/correspondent')
export class CorrespondentBankController {
  constructor(private readonly bankService: CorrespondentBankService) {}

  @Post('/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar nuevo banco corresponsal' })
  @ApiResponse({ status: 201, description: 'Banco registrado' })
  async create(@Body() dto: CreateCorrespondentDto) {
    return this.bankService.create(dto);
  }

  @Get('/list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar bancos corresponsales activos' })
  @ApiResponse({ status: 200, description: 'Lista de bancos' })
  async list(@Query('activeOnly') activeOnly: string = 'true') {
    return this.bankService.findAll(activeOnly === 'true');
  }

  @Get('/:id/details')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalles completos banco corresponsal' })
  @ApiResponse({ status: 200, description: 'Detalle del banco' })
  async getById(@Param('id') id: string) {
    return this.bankService.findById(id);
  }

  @Get('/swift/:bic')
  @ApiOperation({ summary: 'Buscar por código SWIFT' })
  @ApiResponse({ status: 200, description: 'Banco encontrado' })
  async getBySwift(@Param('bic') bic: string) {
    return this.bankService.findBySwift(bic);
  }

  @Put('/:id/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar detalles banco corresponsal' })
  async update(@Param('id') id: string, @Body() dto: UpdateCorrespondentDto) {
    return this.bankService.update(id, dto);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar de baja relación corresponsal' })
  async deactivate(@Param('id') id: string, @Body() reason: { terminationDate: Date; reason?: string }) {
    await this.bankService.deactivate(id, reason.terminationDate, reason.reason);
    return { success: true };
  }

  @Get('/:id/risk-score')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Riesgo crediticio país reputacional score' })
  async getRiskScore(@Param('id') id: string) {
    const bank = await this.bankService.findById(id);
    return { id, riskScore: bank.riskScoreInternal, countryRating: bank.countryRiskRating };
  }

  @Get('/:id/compliance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado compliance KYC screenings' })
  async getComplianceStatus(@Param('id') id: string) {
    const bank = await this.bankService.findById(id);
    return {
      kycStatus: bank.kycStatus,
      lastScreenDate: bank.lastSanctionScreenDate,
      annualReview: bank.annualReviewDate,
      wolfsbergMember: bank.wolfsbergMember,
    };
  }

  @Put('/:id/annual-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar revisión anual' })
  async updateAnnualReview(@Param('id') id: string) {
    return this.bankService.updateAnnualReview(id);
  }

  @Post('/:id/exposure')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar exposición actual' })
  async updateExposure(@Param('id') id: string, @Body() body: { currentExposureUsd: number }) {
    return this.bankService.updateExposure(id, body.currentExposureUsd);
  }

  @Get('/country-exposure/:country')
  @ApiOperation({ summary: 'Exposición consolidada por país' })
  async getCountryExposure(@Param('country') countryCode: string) {
    return this.bankService.getListOfCorrespondentsWithCountryExposure(countryCode);
  }

  @Get('/high-risk')
  @ApiOperation({ summary: 'Lista de bancos high-risk' })
  async getHighRisk(@Query('threshold') threshold: number = 70) {
    return this.bankService.getHighRiskCorrespondents(threshold);
  }
}
