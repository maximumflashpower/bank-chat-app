import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import { TimeTrackingService } from '../services/time-tracking.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { LogTimeDto } from '../dto/log-time.dto';
import { ProjectStatus } from '../entities/project-status.enum';

@ApiTags('SMB Budgeting - Project')
@Controller('api/smb-budgeting/project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly timeTrackingService: TimeTrackingService
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all projects for a company' })
  async findAll(@Query('companyId') companyId: string) {
    return this.projectService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
    return this.projectService.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: ProjectStatus) {
    return this.projectService.updateStatus(id, status);
  }

  @Get(':id/profitability')
  @ApiOperation({ summary: 'Get project profitability' })
  async getProfitability(@Param('id') id: string) {
    return this.projectService.getProfitability(id);
  }

  @Put(':id/budget')
  @ApiOperation({ summary: 'Update project budget' })
  async updateBudget(@Param('id') id: string, @Body('amount') amount: number) {
    return this.projectService.updateBudget(id, amount);
  }

  @Post(':id/log-time')
  @ApiOperation({ summary: 'Log time entry for project' })
  async logTime(@Param('id') id: string, @Body() dto: LogTimeDto) {
    return this.timeTrackingService.logTime({ ...dto, projectId: id });
  }

  @Post(':id/log-expense')
  @ApiOperation({ summary: 'Log expense to project' })
  async logExpense(@Param('id') id: string, @Body('amount') amount: number) {
    return this.projectService.logExpense(id, amount);
  }

  @Get(':id/time-entries')
  @ApiOperation({ summary: 'Get time entries for project' })
  async getTimeEntries(@Param('id') id: string) {
    return this.timeTrackingService.findByProject(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  async delete(@Param('id') id: string) {
    await this.projectService.delete(id);
    return { message: 'Project deleted' };
  }
}
