import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LetterOfCreditService } from '../services/letter-of-credit.service';
import { LCStatus } from '../enums/lc-status.enum';

@ApiTags('trade')
@Controller('api/v1/trade/lc')
export class LetterOfCreditController {
  constructor(private readonly service: LetterOfCreditService) {}

  @Post('/issue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue new letter of credit' })
  async issue(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get LC details' })
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('/number/:lcNumber')
  @ApiOperation({ summary: 'Lookup by LC number' })
  async getByNumber(@Param('lcNumber') lcNumber: string) {
    return this.service.findByNumber(lcNumber);
  }

  @Get('/list')
  @ApiOperation({ summary: 'List all LCs with filters' })
  async list(@Query('status') status?: LCStatus, @Query('applicantId') applicantId?: string) {
    return this.service.findAll({ status, applicantId });
  }

  @Put('/:id/amend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Amend LC terms' })
  async amend(@Param('id') id: string, @Body() amendments: Partial<any>) {
    return this.service.amend(id, amendments);
  }

  @Post('/:id/close')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close LC' })
  async close(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.close(id, body.reason);
  }

  @Post('/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel LC' })
  async cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.cancel(id, body.reason);
  }

  @Put('/:id/extend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend LC expiry' })
  async extend(@Param('id') id: string, @Body() body: { newExpiryDate: Date }) {
    return this.service.extendExpiry(id, body.newExpiryDate);
  }

  @Get('/:id/risk-score')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate LC risk score' })
  async getRiskScore(@Param('id') id: string) {
    const lc = await this.service.findById(id);
    const score = await this.service.calculateRiskScore(lc);
    return { id, riskScore: score };
  }

  @Get('/:id/compliance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate LC compliance' })
  async validateCompliance(@Param('id') id: string) {
    const lc = await this.service.findById(id);
    return this.service.validateCompliance(lc);
  }

  @Get('/:id/utilization')
  @ApiOperation({ summary: 'Get LC utilization rate' })
  async getUtilization(@Param('id') id: string) {
    const lc = await this.service.findById(id);
    const rate = await this.service.getUtilizationRate(lc.applicantName);
    return { applicant: lc.applicantName, utilizationRate: rate };
  }
}
