import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BankGuaranteeService } from '../services/bank-guarantee.service';
import { GuaranteeStatus } from '../enums/guarantee-status.enum';

@ApiTags('trade')
@Controller('api/v1/trade/guarantee')
export class BankGuaranteeController {
  constructor(private readonly service: BankGuaranteeService) {}

  @Post('/issue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue new bank guarantee' })
  async issue(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get guarantee details' })
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('/number/:guaranteeNumber')
  @ApiOperation({ summary: 'Lookup by guarantee number' })
  async getByNumber(@Param('guaranteeNumber') guaranteeNumber: string) {
    return this.service.findByNumber(guaranteeNumber);
  }

  @Get('/list')
  @ApiOperation({ summary: 'List guarantees with filters' })
  async list(@Query('status') status?: GuaranteeStatus, @Query('applicantId') applicantId?: string) {
    return this.service.findAll({ status, applicantId });
  }

  @Post('/:id/claim')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make claim on guarantee' })
  async claim(@Param('id') id: string, @Body() body: { claimAmount: number; reason: string }) {
    return this.service.claim(id, body.claimAmount, body.reason);
  }

  @Post('/:id/release')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release guarantee' })
  async release(@Param('id') id: string) {
    return this.service.release(id);
  }

  @Post('/:id/expire')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark guarantee as expired' })
  async expire(@Param('id') id: string) {
    return this.service.expire(id);
  }

  @Put('/:id/extend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend guarantee expiry' })
  async extend(@Param('id') id: string, @Body() body: { newExpiryDate: Date }) {
    return this.service.extend(id, body.newExpiryDate);
  }

  @Post('/:id/exposure')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate exposure for applicant' })
  async getExposure(@Body() body: { applicantId: string }) {
    const exposure = await this.service.getExposure(body.applicantId);
    return { applicantId: body.applicantId, exposure };
  }

  @Post('/premium/calculate')
  @ApiOperation({ summary: 'Calculate guarantee premium' })
  async calculatePremium(@Body() body: { amount: number; tenorMonths: number }) {
    const premium = await this.service.calculatePremium(body.amount, body.tenorMonths);
    return { amount: body.amount, tenorMonths: body.tenorMonths, premium };
  }
}
