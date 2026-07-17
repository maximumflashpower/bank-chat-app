import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../../identity/guards/roles.guard';
import { Roles } from '../../identity/decorators/roles.decorator';
import { RoleType } from '../../identity/entities/role.enum';
import { TaxNexusService } from '../services/tax-nexus.service';
import { RegisterNexusDto } from '../dto/register-nexus.dto';

@Controller('v1/tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NexusController {
  constructor(
    private nexusService: TaxNexusService,
  ) {}

  @Post('nexus/register')
  @Roles(RoleType.ADMIN)
  async registerNexus(@Body() dto: RegisterNexusDto): Promise<any> {
    return this.nexusService.registerNexus(dto);
  }

  @Get('nexus/:countryCode')
  @Roles(RoleType.ADMIN)
  async getNexusByCountry(@Param('countryCode') countryCode: string): Promise<any[]> {
    return this.nexusService.findNexusByCountry(countryCode);
  }

  @Post('nexus/check')
  @Roles(RoleType.ADMIN)
  async checkNexus(
    @Body() body: { countryCode: string; salesVolume: number },
  ): Promise<{ hasNexus: boolean; threshold?: number }> {
    return this.nexusService.checkNexusObligation(body.countryCode, body.salesVolume);
  }
}
