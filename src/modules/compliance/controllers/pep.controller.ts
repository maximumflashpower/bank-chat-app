import { Controller, Post, Get, Query, Param, Logger } from '@nestjs/common';
import { PepService } from '../services/pep.service';
import { BeneficialOwnerService } from '../services/beneficial-owner.service';

@Controller('v1')
export class PepController {
  private readonly logger = new Logger(PepController.name);

  constructor(
    private readonly pepService: PepService,
    private readonly boService: BeneficialOwnerService,
  ) {}

  /** GET /api/v1/pep/search - Buscar PEP por nombre */
  @Get('pep/search')
  async searchPep(@Query('name') name: string): Promise<any> {
    const result = await this.pepService.searchPep(name);
    return { isPep: result.isPep, matchCount: result.matchCount, records: result.records.map((r) => ({ id: r.id, fullName: r.fullName, country: r.country, position: r.position })) };
  }

  /** GET /api/v1/beneficial-owner/{entityId} - Estructura de beneficiarios finales */
  @Get('beneficial-owner/:entityId')
  async getBeneficialOwners(@Param('entityId') entityId: string): Promise<any[]> {
    const owners = await this.boService.getByEntityId(entityId);
    return owners.map((o) => ({ id: o.id, ownerName: o.ownerName, ownershipPct: Number(o.ownershipPct), isPep: o.isPep, kycVerified: o.kycVerified }));
  }
}
