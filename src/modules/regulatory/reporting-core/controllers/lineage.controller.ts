import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LineageService } from '../services/lineage.service';

@ApiTags('regulatory-lineage')
@Controller('api/regulatory/lineage')
export class LineageController {
  private readonly logger = new Logger(LineageController.name);

  constructor(private readonly lineageService: LineageService) {}

  @Post()
  @ApiOperation({ summary: 'Create new data lineage record' })
  @ApiResponse({ status: 201, description: 'Lineage created successfully' })
  async createLineage(@Body() body: any, @Body('userId') userId: string) {
    const result = await this.lineageService.createLineage(
      body.reportName,
      body.reportPath,
      body.reportDate,
      body.dataSources,
      body.transformations,
      body.sourceFields,
      body.targetFields,
      userId,
      body.options,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lineage by ID' })
  async findById(@Param('id') id: string) {
    return this.lineageService.findById(id);
  }

  @Get('/report/:reportName')
  @ApiOperation({ summary: 'Get lineage by report name' })
  async findByReportName(@Param('reportName') reportName: string) {
    return this.lineageService.findByReportName(reportName);
  }

  @Post('/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit lineage for review' })
  async reviewLineage(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.lineageService.reviewLineage(id, reviewerId);
  }

  @Post('/:id/certify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Certify lineage' })
  async certifyLineage(@Param('id') id: string, @Body('reviewerId') reviewerId: string) {
    return this.lineageService.certifyLineage(id, reviewerId);
  }

  @Post('/:id/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'File certified lineage' })
  async fileLineage(@Param('id') id: string, @Body('filerId') filerId: string) {
    return this.lineageService.fileLineage(id, filerId);
  }

  @Get('/:id/traceability')
  @ApiOperation({ summary: 'Get traceability report' })
  async getTraceabilityReport(@Param('id') id: string) {
    return this.lineageService.getTraceabilityReport(id);
  }
}
