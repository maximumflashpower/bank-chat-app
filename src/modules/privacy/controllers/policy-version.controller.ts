import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { PolicyVersionService } from '../services/policy-version.service';
import { CreatePolicyVersionDto } from '../dto/create-policy-version.dto';
import { PublishPolicyVersionDto } from '../dto/publish-policy-version.dto';

@ApiTags('Privacy — Policy Versioning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/privacy')
export class PolicyVersionController {
  constructor(private readonly service: PolicyVersionService) {}

  @Get('policy/versions')
  @ApiOperation({ summary: 'Listar versiones de política (PRIV-MISC-001) — Admin' })
  async listVersions() {
    return this.service.listVersions();
  }

  @Get('policy/versions/current')
  @ApiOperation({ summary: 'Obtener versión publicada actual (PRIV-MISC-001)' })
  async getCurrentPublished() {
    return this.service.getCurrentPublished();
  }

  @Get('policy/versions/:id')
  @ApiOperation({ summary: 'Obtener versión por ID (PRIV-MISC-001)' })
  async getById(@Param('id') id: string) {
    return this.service.getVersion(id);
  }

  @Post('policy/versions')
  @ApiOperation({ summary: 'Crear nueva versión draft (PRIV-MISC-001) — Admin' })
  async create(@Body() dto: CreatePolicyVersionDto) {
    return this.service.createVersion(dto);
  }

  @Post('policy/versions/:id/publish')
  @ApiOperation({ summary: 'Publicar versión (PRIV-MISC-001) — Admin' })
  async publish(@Param('id') id: string, @Body() dto: PublishPolicyVersionDto) {
    return this.service.publishVersion(id, dto.publishedBy);
  }

  @Get('policy/reconsent-check/:userId')
  @ApiOperation({ summary: 'Verificar si usuario requiere re-consentimiento (PRIV-MISC-001)' })
  async checkReconsent(@Param('userId') userId: string) {
    return this.service.checkReconsentRequired(userId);
  }
}
