import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { ProcessingActivityService } from '../services/processing-activity.service';
import { CreateProcessingActivityDto } from '../dto/create-processing-activity.dto';
import { UpdateProcessingActivityDto } from '../dto/update-processing-activity.dto';

@ApiTags('Privacy — Processing Activities (Art 30)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/privacy')
export class ProcessingActivityController {
  constructor(private readonly service: ProcessingActivityService) {}

  @Get('processing-activities')
  @ApiOperation({ summary: 'Listar actividades de procesamiento (PRIV-ART30-001) — Admin' })
  async listAll() {
    return this.service.listAllActivities();
  }

  @Post('processing-activities/create')
  @ApiOperation({ summary: 'Registrar nueva actividad (PRIV-ART30-002) — Admin' })
  async create(@Body() dto: CreateProcessingActivityDto) {
    return this.service.createActivity(dto);
  }

  @Put('processing-activities/:id')
  @ApiOperation({ summary: 'Actualizar actividad (PRIV-ART30-002) — Admin' })
  async update(@Param('id') id: string, @Body() dto: UpdateProcessingActivityDto) {
    return this.service.updateActivity(id, dto);
  }

  @Delete('processing-activities/:id')
  @ApiOperation({ summary: 'Eliminar actividad (PRIV-ART30-004) — Admin' })
  async remove(@Param('id') id: string) {
    await this.service.deleteActivity(id);
    return { message: 'Actividad eliminada' };
  }

  @Get('processing-activities/export')
  @ApiOperation({ summary: 'Exportar registro para auditoría (PRIV-ART30-003) — Admin' })
  async exportForAudit() {
    return this.service.exportForAudit();
  }
}
