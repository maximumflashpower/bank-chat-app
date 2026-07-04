import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { PolicyService } from '../services/policy.service';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';

@ApiTags('Governance — Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance/policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new policy as-code' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async create(@Body() dto: CreatePolicyDto, @Request() req: any) {
    return this.policyService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all policies' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async findAll(@Query('domain') domain?: string, @Query('status') status?: string) {
    return this.policyService.findAll({ domain, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy details' })
  @ApiResponse({ status: 200, description: 'Policy details' })
  async findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update policy' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    return this.policyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete policy' })
  @ApiResponse({ status: 200, description: 'Policy deleted' })
  async remove(@Param('id') id: string) {
    return this.policyService.remove(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get policy version history' })
  @ApiResponse({ status: 200, description: 'Version history' })
  async getVersions(@Param('id') id: string) {
    return this.policyService.getVersions(id);
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: 'Rollback policy to a previous version' })
  @ApiResponse({ status: 200, description: 'Policy rolled back' })
  async rollback(@Param('id') id: string, @Body() body: { targetVersion: number }) {
    return this.policyService.rollback(id, body.targetVersion);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Dry-run test a policy against input' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async dryRunTest(@Param('id') id: string, @Body() body: { input: Record<string, any> }) {
    return this.policyService.dryRunTest(id, body.input);
  }
}
