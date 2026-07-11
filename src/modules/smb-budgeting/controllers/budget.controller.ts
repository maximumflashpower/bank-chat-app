import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BudgetService } from '../services/budget.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { CloneBudgetDto } from '../dto/clone-budget.dto';

@ApiTags('SMB Budgeting - Budget')
@Controller('api/smb-budgeting/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  async create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all budgets for a company' })
  async findAll(@Query('companyId') companyId: string) {
    return this.budgetService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  async findById(@Param('id') id: string) {
    return this.budgetService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve budget' })
  async approve(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.budgetService.approveBudget(id, approvedBy);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject budget' })
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.budgetService.rejectBudget(id, reason);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive budget' })
  async archive(@Param('id') id: string) {
    return this.budgetService.archiveBudget(id);
  }

  @Get(':id/variance')
  @ApiOperation({ summary: 'Get budget variance' })
  async getVariance(@Param('id') id: string) {
    return this.budgetService.calculateVariance(id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone budget to new fiscal year' })
  async clone(@Param('id') id: string, @Body() dto: CloneBudgetDto) {
    return this.budgetService.cloneBudget(id, dto);
  }

  @Get('alerts/variance')
  @ApiOperation({ summary: 'Get budget alerts' })
  async getAlerts(@Query('companyId') companyId: string) {
    return this.budgetService.getAlerts(companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  async delete(@Param('id') id: string) {
    await this.budgetService.delete(id);
    return { message: 'Budget deleted' };
  }
}
