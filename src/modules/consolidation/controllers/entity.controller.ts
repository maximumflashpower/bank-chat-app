import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EntityRegistryService } from '../services/entity-registry.service';
import { CreateEntityDto } from '../dto/create-entity.dto';

@ApiTags('Consolidation — Entities')
@ApiBearerAuth()
@Controller('consolidation/entities')
export class EntityController {
  constructor(private readonly entityService: EntityRegistryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las entidades legales' })
  async findAll() {
    return this.entityService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener entidad por ID' })
  async findById(@Param('id') id: string) {
    return this.entityService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva entidad legal' })
  async create(@Body() dto: CreateEntityDto) {
    return this.entityService.createEntity(dto as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar entidad' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateEntityDto>) {
    return this.entityService.updateEntity(id, dto as any);
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Obtener árbol jerárquico de entidades' })
  async getTree(@Param('id') id: string) {
    return this.entityService.getEntityTree(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Listar entidades hijas' })
  async getChildren(@Param('id') id: string) {
    return this.entityService.findChildren(id);
  }

  @Get(':id/ownership-chain')
  @ApiOperation({ summary: 'Obtener cadena de ownership' })
  async getOwnershipChain(@Param('id') id: string) {
    return this.entityService.getOwnershipChain(id);
  }

  @Get(':id/effective-ownership')
  @ApiOperation({ summary: 'Calcular ownership efectivo (%)' })
  async getEffectiveOwnership(@Param('id') id: string) {
    const pct = await this.entityService.calculateEffectiveOwnership(id);
    return { entityId: id, effectiveOwnership: pct };
  }

  @Get(':id/consolidation-scope')
  @ApiOperation({ summary: 'Obtener scope de consolidación' })
  async getConsolidationScope(@Param('id') id: string) {
    return this.entityService.getConsolidationScope(id);
  }
}
