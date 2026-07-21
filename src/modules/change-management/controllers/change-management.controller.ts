import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ChangeManagementService } from '../services/change-management.service';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { ReviewChangeDto } from '../dto/review-change.dto';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';

@ApiTags('Change Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/change-management')
export class ChangeManagementController {
  constructor(private readonly changeManagementService: ChangeManagementService) {}

  /** CHG-MGMT-001 */
  @Post('changes')
  @ApiOperation({ summary: 'Crear solicitud de cambio' })
  async createChangeRequest(@Body() dto: CreateChangeRequestDto, @Req() req: any) {
    return this.changeManagementService.createChangeRequest(dto, req.user.id);
  }

  /** CHG-MGMT-002 */
  @Post('changes/:id/review')
  @ApiOperation({ summary: 'Revisar solicitud de cambio' })
  async reviewChange(@Param('id') id: string, @Body() dto: ReviewChangeDto, @Req() req: any) {
    return this.changeManagementService.reviewChange(id, dto, req.user.id);
  }

  /** CHG-MGMT-003 */
  @Get('changes/:id/assess')
  @ApiOperation({ summary: 'Evaluar impacto del cambio' })
  async assessImpact(@Param('id') id: string) {
    return this.changeManagementService.assessImpact(id);
  }

  /** CHG-MGMT-004 */
  @Get('changes')
  @ApiOperation({ summary: 'Listar solicitudes de cambio' })
  async listChanges(@Query() query: any) {
    return this.changeManagementService.listChanges(query);
  }

  /** CHG-MGMT-005 */
  @Post('changes/:id/implement')
  @ApiOperation({ summary: 'Implementar cambio aprobado' })
  async implementChange(@Param('id') id: string) {
    return this.changeManagementService.implementChange(id);
  }

  /** CHG-MGMT-006 */
  @Post('changes/:id/rollback')
  @ApiOperation({ summary: 'Revertir cambio implementado' })
  async rollbackChange(@Param('id') id: string) {
    return this.changeManagementService.rollbackChange(id);
  }

  /** CHG-MGMT-007 */
  @Post('flags')
  @ApiOperation({ summary: 'Crear feature flag' })
  async createFeatureFlag(@Body() dto: CreateFeatureFlagDto) {
    return this.changeManagementService.createFeatureFlag(dto);
  }

  /** CHG-MGMT-008 */
  @Patch('flags/:key/rollout')
  @ApiOperation({ summary: 'Actualizar rollout percentage' })
  async updateRollout(@Param('key') key: string, @Body() body: any) {
    return this.changeManagementService.updateRollout(key, body.percentage);
  }

  /** CHG-MGMT-009 */
  @Get('flags/:key/evaluate/:userId')
  @ApiOperation({ summary: 'Evaluar feature flag para usuario' })
  async evaluateFlag(@Param('key') key: string, @Param('userId') userId: string) {
    return this.changeManagementService.evaluateFlag(key, userId);
  }

  /** CHG-MGMT-010 */
  @Post('flags/:key/kill')
  @ApiOperation({ summary: 'Activar kill switch de feature flag' })
  async killSwitch(@Param('key') key: string) {
    return this.changeManagementService.killSwitch(key);
  }

  /** CHG-MOD-001 */
  @Get('changes/:id/predict')
  @ApiOperation({ summary: 'Predecir probabilidad de fallo del cambio' })
  async predictChangeFailure(@Param('id') id: string) {
    return this.changeManagementService.predictChangeFailure(id);
  }

  /** CHG-MOD-002 */
  @Post('changes/:id/auto-rollback')
  @ApiOperation({ summary: 'Verificar y ejecutar auto-rollback' })
  async checkAutoRollback(@Param('id') id: string) {
    return this.changeManagementService.checkAutoRollback(id);
  }

  /** CHG-MOD-003 */
  @Get('velocity')
  @ApiOperation({ summary: 'Obtener velocidad de cambios' })
  async getChangeVelocity() {
    return this.changeManagementService.getChangeVelocity();
  }

  /** CHG-MOD-004 */
  @Get('benchmark')
  @ApiOperation({ summary: 'Obtener benchmark de deployments' })
  async getDeploymentBenchmark() {
    return this.changeManagementService.getDeploymentBenchmark();
  }

  /** CHG-MOD-005 */
  @Get('changes/:id/orchestration')
  @ApiOperation({ summary: 'Obtener orquestación de release' })
  async getReleaseOrchestration(@Param('id') id: string) {
    return this.changeManagementService.getReleaseOrchestration(id);
  }
}
