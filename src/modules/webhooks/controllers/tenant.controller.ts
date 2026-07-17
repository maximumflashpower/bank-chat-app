import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { TenantPlan } from '../entities/tenant.entity';

@ApiTags('Tenants')
@Controller('v1/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({ status: 200, description: 'Tenant list' })
  async listTenants() {
    return this.tenantService.listTenants();
  }

  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  async createTenant(@Body() data: { name: string; plan?: TenantPlan }) {
    return this.tenantService.createTenant({
      name: data.name,
      plan: data.plan || TenantPlan.FREE,
    });
  }

  @Post(':id/suspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend tenant' })
  @ApiResponse({ status: 200, description: 'Tenant suspended' })
  async suspendTenant(@Param('id') id: string) {
    return this.tenantService.suspendTenant(id);
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiResponse({ status: 200, description: 'Tenant activated' })
  async activateTenant(@Param('id') id: string) {
    return this.tenantService.activateTenant(id);
  }

  @Get(':id/usage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant usage metrics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsage(@Param('id') id: string) {
    return this.tenantService.getUsageStats(id);
  }

  @Post(':id/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export tenant data' })
  @ApiResponse({ status: 200, description: 'Export generated' })
  async exportData(@Param('id') id: string) {
    return this.tenantService.exportTenantData(id);
  }

  @Put(':id/config')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant configuration' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  async updateConfig(
    @Param('id') id: string,
    @Body() config: Record<string, unknown>,
  ) {
    return this.tenantService.updateTenantConfig(id, config);
  }
}
