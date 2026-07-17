import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { DataPipelineService } from '../services/data-pipeline.service';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { SearchCatalogDto } from '../dto/search-catalog.dto';

@ApiTags('Data Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/data-pipeline')
export class DataPipelineController {
  constructor(private readonly dataPipelineService: DataPipelineService) {}

  /** BBC-DLP-V3-001 */
  @Get('pipelines')
  @ApiOperation({ summary: 'Listar pipelines' })
  async listPipelines(@Query() query: any, @Req() req: any) {
    return this.dataPipelineService.listPipelines();
  }

  /** BBC-DLP-V3-002 */
  @Post('pipelines')
  @ApiOperation({ summary: 'Crear pipeline' })
  async createPipeline(@Body() dto: CreatePipelineDto, @Req() req: any) {
    return this.dataPipelineService.createPipeline(dto);
  }

  /** BBC-DLP-V3-003 */
  @Patch('pipelines/:id/status')
  @ApiOperation({ summary: 'Actualizar estado del pipeline' })
  async updatePipelineStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.updatePipelineStatus(id, body.status);
  }

  /** BBC-DLP-V3-004 */
  @Get('pipelines/:id/health')
  @ApiOperation({ summary: 'Obtener salud del pipeline' })
  async getPipelineHealth(@Param('id') id: string) {
    return this.dataPipelineService.getPipelineHealth(id);
  }

  /** BBC-DLP-V3-005 */
  @Get('pipelines/:id/metrics')
  @ApiOperation({ summary: 'Obtener métricas del pipeline' })
  async getPipelineMetrics(@Param('id') id: string) {
    return this.dataPipelineService.getPipelineMetrics(id);
  }

  /** BBC-DLP-V3-006 */
  @Post('pipelines/:id/trigger')
  @ApiOperation({ summary: 'Disparar ejecución del pipeline' })
  async triggerExecution(@Param('id') id: string, @Req() req: any) {
    return this.dataPipelineService.triggerExecution(id);
  }

  /** BBC-DLP-V3-007 */
  @Post('pipelines/:id/batch')
  @ApiOperation({ summary: 'Disparar ingestión batch' })
  async triggerBatchIngestion(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.triggerBatchIngestion(id, body);
  }

  /** BBC-DLP-V3-008 */
  @Get('pipelines/:id/stream-status')
  @ApiOperation({ summary: 'Obtener estado del stream' })
  async getStreamStatus(@Param('id') id: string) {
    return this.dataPipelineService.getStreamStatus(id);
  }

  /** BBC-DLP-V3-009 */
  @Post('pipelines/:id/cdc/register')
  @ApiOperation({ summary: 'Registrar tabla CDC' })
  async registerCdcTable(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.registerCdcTable(id, body);
  }

  /** BBC-DLP-V3-010 */
  @Get('pipelines/:id/cdc/checkpoint')
  @ApiOperation({ summary: 'Obtener checkpoint CDC' })
  async getCdcCheckpoint(@Param('id') id: string) {
    return this.dataPipelineService.getCdcCheckpoint(id);
  }

  /** BBC-DLP-V3-011 */
  @Get('catalog/search')
  @ApiOperation({ summary: 'Buscar en catálogo de datos' })
  async searchCatalog(@Query() dto: SearchCatalogDto) {
    return this.dataPipelineService.searchCatalog(dto);
  }

  /** BBC-DLP-V3-012 */
  @Post('catalog/register')
  @ApiOperation({ summary: 'Registrar entrada en catálogo' })
  async registerCatalogEntry(@Body() body: any, @Req() req: any) {
    return this.dataPipelineService.registerCatalogEntry(body);
  }

  /** BBC-DLP-V3-013 */
  @Patch('catalog/:id/lineage')
  @ApiOperation({ summary: 'Actualizar linaje de datos' })
  async updateLineage(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.updateLineage(id, body, req.user.id);
  }

  /** BBC-DLP-V3-014 */
  @Post('schema/:id/validate')
  @ApiOperation({ summary: 'Validar compatibilidad de esquema' })
  async validateSchemaCompatibility(@Param('id') id: string, @Body() body: any) {
    return this.dataPipelineService.validateSchemaCompatibility(body.oldSchema, body.newSchema, body.direction);
  }

  /** BBC-DLP-V3-015 */
  @Post('schema/:id/version')
  @ApiOperation({ summary: 'Registrar versión de esquema' })
  async registerSchemaVersion(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.registerSchemaVersion(id, body);
  }

  /** BBC-DLP-V3-016 */
  @Post('schema/:id/evolution')
  @ApiOperation({ summary: 'Verificar evolución de esquema' })
  async checkSchemaEvolution(@Param('id') id: string, @Body() body: any) {
    return this.dataPipelineService.checkSchemaEvolution(id, body);
  }

  /** BBC-DLP-V3-017 */
  @Post('quality/:id/run')
  @ApiOperation({ summary: 'Ejecutar validación de calidad' })
  async runQualityValidation(@Param('id') id: string, @Req() req: any) {
    return this.dataPipelineService.runQualityValidation(id, req.user.id);
  }

  /** BBC-DLP-V3-018 */
  @Patch('quality/:id/score')
  @ApiOperation({ summary: 'Actualizar score de calidad' })
  async updateQualityScore(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.updateQualityScore(id, body.score);
  }

  /** BBC-DLP-V3-019 */
  @Get('dependency-graph')
  @ApiOperation({ summary: 'Obtener grafo de dependencias' })
  async getDependencyGraph(@Query() query: any) {
    return this.dataPipelineService.getDependencyGraph();
  }

  /** BBC-DLP-V3-020 */
  @Post('pipelines/:id/alerts')
  @ApiOperation({ summary: 'Configurar alertas del pipeline' })
  async configurePipelineAlerts(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.dataPipelineService.configurePipelineAlerts(id, body);
  }
}
