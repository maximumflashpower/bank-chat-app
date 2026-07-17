import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { BreachService } from '../services/breach.service';
import { CreateBreachDto } from '../dto/create-breach.dto';
import { AssessBreachDto } from '../dto/assess-breach.dto';
import { NotifyBreachDto } from '../dto/notify-breach.dto';

@ApiTags('Privacy — Breach Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class BreachController {
  constructor(private readonly service: BreachService) {}

  @Get('breach/all')
  @ApiOperation({ summary: 'Listar todas las brechas (PRIV-BREACH-001) — Admin' })
  async listAll() {
    return this.service.listAllBreaches();
  }

  @Get('breach/:id')
  @ApiOperation({ summary: 'Obtener brecha por ID (PRIV-BREACH-001) — Admin' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('breach/create')
  @ApiOperation({ summary: 'Registrar nueva brecha (PRIV-BREACH-001) — Admin' })
  async create(@Body() dto: CreateBreachDto) {
    return this.service.createBreach(dto);
  }

  @Put('breach/:id/assess')
  @ApiOperation({ summary: 'Evaluar severidad (PRIV-BREACH-002) — Admin' })
  async assess(@Param('id') id: string, @Body() dto: AssessBreachDto) {
    return this.service.assessRisk(id, dto);
  }

  @Post('breach/:id/notify-authority')
  @ApiOperation({ summary: 'Notificar a autoridad 72h (PRIV-BREACH-003) — Admin' })
  async notifyAuthority(@Param('id') id: string, @Body() dto: NotifyBreachDto) {
    return this.service.notifySupervisoryAuthority(id, dto);
  }

  @Post('breach/:id/notify-users')
  @ApiOperation({ summary: 'Notificar usuarios afectados (PRIV-BREACH-004) — Admin' })
  async notifyUsers(@Param('id') id: string, @Body() body: { templateMessage: string }) {
    return this.service.notifyAffectedUsers(id, body.templateMessage);
  }

  @Post('breach/:id/contain')
  @ApiOperation({ summary: 'Contener daño (PRIV-BREACH-005) — Admin' })
  async contain(@Param('id') id: string, @Body() body: { containmentActions: string }) {
    return this.service.containDamage(id, body.containmentActions);
  }

  @Post('breach/:id/close')
  @ApiOperation({ summary: 'Cerrar caso forense (PRIV-BREACH-005) — Admin' })
  async close(@Param('id') id: string) {
    return this.service.closeBreachCase(id);
  }

  @Get('breach/overdue')
  @ApiOperation({ summary: 'Listar brechas vencidas (PRIV-BREACH-002) — Admin' })
  async checkOverdue() {
    return this.service.checkOverdueNotifications();
  }
}
