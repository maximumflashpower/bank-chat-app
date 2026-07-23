import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CorrespondentComplianceService } from '../services/correspondent-compliance.service';

@ApiTags('correspondent')
@Controller('v1/correspondent')
export class CorrespondentComplianceController {
  constructor(private readonly complianceService: CorrespondentComplianceService) {}

  @Post('/:id/sanctions/screen')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Screening OFAC UN EU listas' })
  async screenCorrespondent(
    @Param('id') id: string,
    @Body() body: { entityName: string; bic?: string; country?: string },
  ) {
    return this.complianceService.screenCorrespondent(id, body.entityName, body.bic, body.country);
  }

  @Get('/:id/screening-results')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resultados de screening reciente' })
  async getScreeningResults(@Param('id') id: string) {
    return this.complianceService.getScreeningResults(id);
  }

  @Post('/screening/:resultId/escalate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Escalar alerta de sanción' })
  async escalateScreening(@Param('resultId') resultId: string, @Body() body: { escalatedToUserId: string }) {
    return this.complianceService.escalateScreening(resultId, body.escalatedToUserId);
  }

  @Post('/screening/:resultId/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver alerta de sanción' })
  async resolveScreening(
    @Param('resultId') resultId: string,
    @Body() body: { resolutionAction: string; resolutionNotes: string; resolvedByUserId: string },
  ) {
    return this.complianceService.resolveScreening(
      resultId,
      body.resolutionAction,
      body.resolutionNotes,
      body.resolvedByUserId,
    );
  }

  @Get('/:id/wolfsberg-check')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar acuerdo Wolfsberg vigente' })
  async checkWolfsberg(@Param('id') id: string) {
    return this.complianceService.assessWolfsbergCompliance(id);
  }

  @Get('/country-exposure/:countryCode')
  @ApiOperation({ summary: 'Exposición por país' })
  async getCountryExposure(@Param('countryCode') countryCode: string) {
    return this.complianceService.getCountryExposure(countryCode);
  }

  @Post('/:id/exposure-limit-check')
  @ApiOperation({ summary: 'Verificar límite de exposición' })
  async checkExposureLimit(@Param('id') id: string) {
    return this.complianceService.checkExposureLimit(id);
  }

  @Post('/:id/aml-report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar reporte AML' })
  async generateAmlReport(@Param('id') id: string) {
    return this.complianceService.generateAmlReport(id);
  }
}
