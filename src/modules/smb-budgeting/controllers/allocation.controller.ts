import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AllocationService } from '../services/allocation.service';
import { CreateAllocationMethodDto } from '../dto/create-allocation-method.dto';

@ApiTags('SMB Budgeting - Allocation')
@Controller('api/smb-budgeting/allocation')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Post('method-create')
  @ApiOperation({ summary: 'Create allocation method' })
  async createMethod(@Body() dto: CreateAllocationMethodDto) {
    return this.allocationService.createMethod(dto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'List allocation methods' })
  async findAll(@Query('companyId') companyId: string) {
    return this.allocationService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get allocation method by ID' })
  async findById(@Param('id') id: string) {
    return this.allocationService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update allocation method' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateAllocationMethodDto>) {
    return this.allocationService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate allocation method' })
  async deactivate(@Param('id') id: string) {
    return this.allocationService.deactivate(id);
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Run overhead allocation' })
  async runAllocation(
    @Param('id') id: string,
    @Body() departments: { name: string; driverValue: number }[]
  ) {
    return this.allocationService.runAllocation(id, departments);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete allocation method' })
  async delete(@Param('id') id: string) {
    await this.allocationService.delete(id);
    return { message: 'Allocation method deleted' };
  }
}
