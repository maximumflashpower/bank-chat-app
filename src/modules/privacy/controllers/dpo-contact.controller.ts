import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { DpoContactService } from '../services/dpo-contact.service';
import { CreateDpoContactDto } from '../dto/create-dpo-contact.dto';

@ApiTags('Privacy — DPO Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class DpoContactController {
  constructor(private readonly service: DpoContactService) {}

  @Get('dpo/contacts')
  @ApiOperation({ summary: 'Listar contactos DPO (PRIV-MISC-002) — Admin' })
  async listContacts() {
    return this.service.listContacts();
  }

  @Get('dpo/contacts/primary')
  @ApiOperation({ summary: 'Obtener DPO principal (PRIV-MISC-002)' })
  async getPrimary() {
    return this.service.getPrimaryContact();
  }

  @Get('dpo/contacts/:id')
  @ApiOperation({ summary: 'Obtener contacto por ID (PRIV-MISC-002)' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('dpo/contacts')
  @ApiOperation({ summary: 'Crear contacto DPO (PRIV-MISC-002) — Admin' })
  async create(@Body() dto: CreateDpoContactDto) {
    return this.service.createContact(dto);
  }

  @Put('dpo/contacts/:id')
  @ApiOperation({ summary: 'Actualizar contacto (PRIV-MISC-002) — Admin' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateDpoContactDto>) {
    return this.service.updateContact(id, dto);
  }

  @Post('dpo/contacts/:id/deactivate')
  @ApiOperation({ summary: 'Desactivar contacto (PRIV-MISC-002) — Admin' })
  async deactivate(@Param('id') id: string) {
    return this.service.deactivateContact(id);
  }
}
