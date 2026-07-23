import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentExaminationService } from '../services/document-examination.service';
import { ExaminationResult } from '../enums/examination-result.enum';

@ApiTags('trade')
@Controller('v1/trade/documents')
export class DocumentExaminationController {
  constructor(private readonly service: DocumentExaminationService) {}

  @Post('/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit document for examination' })
  async submit(@Body() dto: any) {
    return this.service.submit(dto);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get examination details' })
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('/reference/:ref')
  @ApiOperation({ summary: 'Find documents by LC/guarantee reference' })
  async getByReference(@Param('ref') ref: string) {
    return this.service.findByReference(ref);
  }

  @Put('/:id/examine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete document examination' })
  async examine(
    @Param('id') id: string,
    @Body() body: { result: ExaminationResult; examinerName: string; remarks?: string },
  ) {
    return this.service.examine(id, body.result, body.examinerName, body.remarks);
  }

  @Post('/:id/waive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Waive discrepancy' })
  async waive(@Param('id') id: string, @Body() body: { waiverReason: string }) {
    return this.service.waiveDiscrepancy(id, body.waiverReason);
  }

  @Get('/pending/:ref')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending documents' })
  async getPending(@Param('ref') ref: string) {
    return this.service.getPendingDocuments(ref);
  }

  @Get('/compliance/:ref')
  @ApiOperation({ summary: 'Get compliance rate' })
  async getCompliance(@Param('ref') ref: string) {
    const rate = await this.service.getComplianceRate(ref);
    return { reference: ref, complianceRate: rate };
  }

  @Post('/:id/urgent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark document urgent' })
  async markUrgent(@Param('id') id: string) {
    return this.service.markUrgent(id);
  }

  @Post('/:id/report')
  @ApiOperation({ summary: 'Generate examination report' })
  async generateReport(@Body() body: { ref: string }) {
    return this.service.generateExaminationReport(body.ref);
  }
}
