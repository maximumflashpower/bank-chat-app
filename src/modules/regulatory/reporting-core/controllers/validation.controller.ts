import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ValidationService } from '../services/validation.service';

@ApiTags('regulatory-validation')
@Controller('api/regulatory/validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post()
  @ApiOperation({ summary: 'Create validation rule' })
  async createRule(@Body() body: any, @Body('userId') userId: string) {
    return this.validationService.createRule(
      body.ruleName,
      body.description,
      body.category,
      body.condition,
      userId,
      body.options,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get validation rule by ID' })
  async findById(@Param('id') id: string) {
    return this.validationService.findById(id);
  }

  @Get('/category/:category')
  @ApiOperation({ summary: 'Get rules by category' })
  async findByCategory(@Param('category') category: string) {
    return this.validationService.findByCategory(category as any);
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active validation rules' })
  async findAllActive() {
    return this.validationService.findAllActive();
  }

  @Put('/:id/trigger')
  @ApiOperation({ summary: 'Trigger validation rule' })
  async triggerRule(
    @Param('id') id: string,
    @Body('result') result: 'success' | 'failure' | 'warning' | 'error',
    @Body('error') error?: Record<string, unknown>,
  ) {
    return this.validationService.triggerRule(id, result, error);
  }

  @Put('/:id/activate')
  @ApiOperation({ summary: 'Activate validation rule' })
  async activateRule(@Param('id') id: string) {
    return this.validationService.activateRule(id);
  }

  @Put('/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate validation rule' })
  async deactivateRule(@Param('id') id: string) {
    return this.validationService.deactivateRule(id);
  }

  @Post('/suite/execute')
  @ApiOperation({ summary: 'Execute validation suite against reports' })
  async executeValidationSuite(@Body('reportIds') reportIds: string[]) {
    return this.validationService.executeValidationSuite(reportIds);
  }

  @Get('/report/:reportId')
  @ApiOperation({ summary: 'Get validation report for a specific report' })
  async getValidationReport(@Param('reportId') reportId: string) {
    return this.validationService.getValidationReport(reportId);
  }
}
