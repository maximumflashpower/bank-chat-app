import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ThirdPartyProcessorService } from '../services/third-party-processor.service';
import { CreateThirdPartyProcessorDto } from '../dto/create-third-party-processor.dto';

@ApiTags('Privacy — Third-Party Processors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class ThirdPartyProcessorController {
  constructor(private readonly service: ThirdPartyProcessorService) {}

  @Get('processors')
  @ApiOperation({ summary: 'Listar procesadores (PRIV-MISC-004) — Admin' })
  async listProcessors() {
    return this.service.listProcessors();
  }

  @Get('processors/expiring')
  @ApiOperation({ summary: 'Listar acuerdos por expirar (PRIV-MISC-004) — Admin' })
  async checkExpiring() {
    return this.service.checkExpiringAgreements();
  }

  @Get('processors/cross-border')
  @ApiOperation({ summary: 'Listar transferencias transfronterizas (PRIV-MISC-004) — Admin' })
  async listCrossBorder() {
    return this.service.listCrossBorderTransfers();
  }

  @Get('processors/:id')
  @ApiOperation({ summary: 'Obtener procesador por ID (PRIV-MISC-004)' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('processors')
  @ApiOperation({ summary: 'Registrar procesador (PRIV-MISC-004) — Admin' })
  async create(@Body() dto: CreateThirdPartyProcessorDto) {
    return this.service.createProcessor(dto);
  }

  @Put('processors/:id')
  @ApiOperation({ summary: 'Actualizar procesador (PRIV-MISC-004) — Admin' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateThirdPartyProcessorDto>) {
    return this.service.updateProcessor(id, dto);
  }

  @Post('processors/:id/terminate')
  @ApiOperation({ summary: 'Terminar acuerdo (PRIV-MISC-004) — Admin' })
  async terminate(@Param('id') id: string) {
    return this.service.terminateAgreement(id);
  }
}
