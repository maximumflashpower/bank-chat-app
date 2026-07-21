import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { RetentionService } from '../services/retention.service';
import { CreateRetentionScheduleDto } from '../dto/create-retention-schedule.dto';

@ApiTags('Privacy — Retention & Data Deletion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class RetentionController {
  constructor(private readonly service: RetentionService) {}

  @Get('retention/schedules')
  @ApiOperation({ summary: 'Listar esquemas de retención (PRIV-PBDESIGN-004) — Admin' })
  async listSchedules() {
    return this.service.listSchedules();
  }

  @Get('retention/schedules/:id')
  @ApiOperation({ summary: 'Obtener esquema por ID (PRIV-PBDESIGN-004) — Admin' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('retention/schedules')
  @ApiOperation({ summary: 'Crear esquema de retención (PRIV-PBDESIGN-004) — Admin' })
  async create(@Body() dto: CreateRetentionScheduleDto) {
    return this.service.createSchedule(dto);
  }

  @Put('retention/schedules/:id')
  @ApiOperation({ summary: 'Actualizar esquema (PRIV-PBDESIGN-004) — Admin' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRetentionScheduleDto>) {
    return this.service.updateSchedule(id, dto);
  }

  @Post('retention/schedules/:id/approve')
  @ApiOperation({ summary: 'Aprobar esquema (PRIV-PBDESIGN-005) — Admin' })
  async approve(@Param('id') id: string, @Body() body: { approverName: string }) {
    return this.service.approveSchedule(id, body.approverName);
  }

  @Post('retention/schedules/:id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar esquema — Admin' })
  async toggle(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Post('retention/execute')
  @ApiOperation({ summary: 'Ejecutar eliminación automática (PRIV-PBDESIGN-005) — Admin' })
  async execute() {
    return this.service.executeExpiredRetentions();
  }

  @Delete('retention/schedules/:id')
  @ApiOperation({ summary: 'Eliminar esquema (PRIV-PBDESIGN-005) — Admin' })
  async remove(@Param('id') id: string) {
    await this.service.deleteSchedule(id);
    return { message: 'Esquema eliminado' };
  }
}
