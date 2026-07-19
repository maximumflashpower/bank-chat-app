import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UboService } from '../services/ubo.service';
import { PepStatus, SanctionsScreeningStatus } from '../entities/business-ubo-registration.entity';

@ApiTags('Business — UBO')
@ApiBearerAuth()
@Controller('v1/business/ubo')
export class UboController {
  constructor(private readonly uboService: UboService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar UBO' })
  async registerUbo(@Body() data: any) {
    return this.uboService.registerUbo(data as any);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Listar UBOs por organización' })
  async findByOrganization(@Param('organizationId') organizationId: string) {
    return this.uboService.findByOrganization(organizationId);
  }

  @Get(':uboId')
  @ApiOperation({ summary: 'Detalle UBO' })
  async findById(@Param('uboId') uboId: string) {
    return this.uboService.findById(uboId);
  }

  @Put(':uboId/ownership')
  @ApiOperation({ summary: 'Actualizar porcentaje de propiedad' })
  async updateOwnership(@Param('uboId') uboId: string, @Body() body: { ownershipPercentage: number }) {
    return this.uboService.updateOwnership(uboId, body.ownershipPercentage);
  }

  @Post(':uboId/kyc/verify')
  @ApiOperation({ summary: 'Verificar KYC UBO' })
  async verifyKyc(@Param('uboId') uboId: string) {
    return this.uboService.verifyKyc(uboId);
  }

  @Put(':uboId/pep')
  @ApiOperation({ summary: 'Marcar estado PEP' })
  async markAsPep(@Param('uboId') uboId: string, @Body() body: { pepStatus: PepStatus }) {
    return this.uboService.markAsPep(uboId, body.pepStatus);
  }

  @Put(':uboId/sanctions')
  @ApiOperation({ summary: 'Screening de sanciones' })
  async screenSanctions(@Param('uboId') uboId: string, @Body() body: { status: SanctionsScreeningStatus }) {
    return this.uboService.screenSanctions(uboId, body.status);
  }

  @Put(':uboId/adverse-media')
  @ApiOperation({ summary: 'Marcar adverse media' })
  async flagAdverseMedia(@Param('uboId') uboId: string, @Body() body: { flagged: boolean }) {
    return this.uboService.flagAdverseMedia(uboId, body.flagged);
  }

  @Get(':uboId/risk-profile')
  @ApiOperation({ summary: 'Perfil de riesgo UBO' })
  async getRiskProfile(@Param('uboId') uboId: string) {
    return this.uboService.getRiskProfile(uboId);
  }
}
