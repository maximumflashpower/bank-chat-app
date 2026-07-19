import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ClaimService } from '../services/claim.service';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { UploadEvidenceDto } from '../dto/upload-evidence.dto';

@ApiTags('insurance')
@Controller('api/v1/insurance/claims')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @ApiOperation({ summary: 'Reportar siniestro' })
  async createClaim(@Body() dto: CreateClaimDto) {
    return this.claimService.createClaim(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar claims por póliza' })
  async listClaims(@Body('policyId') policyId: string) {
    return this.claimService.findByPolicy(policyId);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Estado de claim' })
  @ApiParam({ name: 'id' })
  async getClaim(@Param('id') id: string) {
    return this.claimService.findById(id);
  }

  @Post('/:id/evidence')
  @ApiOperation({ summary: 'Subir evidencia' })
  @ApiParam({ name: 'id' })
  async uploadEvidence(@Param('id') id: string, @Body() dto: UploadEvidenceDto) {
    return this.claimService.uploadEvidence(id, dto);
  }

  @Post('/:id/assign')
  @ApiOperation({ summary: 'Asignar adjuster' })
  @ApiParam({ name: 'id' })
  async assignAdjuster(@Param('id') id: string, @Body('adjusterId') adjusterId: string) {
    return this.claimService.assignAdjuster(id, adjusterId);
  }

  @Post('/:id/approve')
  @ApiOperation({ summary: 'Aprobar claim (adjuster)' })
  @ApiParam({ name: 'id' })
  async approveClaim(@Param('id') id: string, @Body('approvedAmount') approvedAmount: number) {
    return this.claimService.approveClaim(id, approvedAmount);
  }

  @Post('/:id/payout')
  @ApiOperation({ summary: 'Pagar claim' })
  @ApiParam({ name: 'id' })
  async payout(@Param('id') id: string, @Body('payoutReference') payoutReference: string) {
    return this.claimService.payout(id, payoutReference);
  }

  @Get('/:id/evidence')
  @ApiOperation({ summary: 'Listar evidencia de claim' })
  @ApiParam({ name: 'id' })
  async getEvidence(@Param('id') id: string) {
    return this.claimService.getEvidence(id);
  }
}
