import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetentionSchedule } from '../entities/retention-schedule.entity';
import { RetentionAction } from '../entities/retention-action.enum';
import { CreateRetentionScheduleDto } from '../dto/create-retention-schedule.dto';

/**
 * Servicio de gestión de retención y eliminación automática de datos
 * Funciones: PRIV-PBDESIGN-001 a PRIV-PBDESIGN-005
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(RetentionSchedule)
    private readonly repo: Repository<RetentionSchedule>,
  ) {}

  /**
   * PRIV-PBDESIGN-004: Crear nuevo esquema de retención
   */
  async createSchedule(dto: CreateRetentionScheduleDto): Promise<RetentionSchedule> {
    const schedule = this.repo.create({
      scheduleName: dto.scheduleName,
      targetTable: dto.targetTable,
      dataType: dto.dataType || null,
      retentionDays: dto.retentionDays,
      startDateField: dto.startDateField || 'created_at',
      expirationAction: dto.expirationAction || RetentionAction.ANONYMIZE,
      gracePeriodDays: dto.gracePeriodDays || 0,
      mandatoryLegalRequirement: dto.mandatoryLegalRequirement || false,
      legalReference: dto.legalReference || null,
      lastActivityField: dto.lastActivityField || null,
      isActive: true,
      approvedBy: null,
      approvalDate: null,
      lastExecutionAt: null,
      recordsProcessedLastRun: 0,
      nextScheduledRun: this.calculateNextRun(dto.retentionDays),
    });

    const saved = await this.repo.save(schedule);

    this.logger.log(
      `Esquema de retención creado: ${saved.scheduleName}, tabla=${saved.targetTable}, días=${saved.retentionDays}`,
    );

    return saved;
  }

  /**
   * PRIV-PBDESIGN-004: Listar todos los esquemas de retención
   */
  async listSchedules(activeOnly = false): Promise<RetentionSchedule[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * PRIV-PBDESIGN-004: Obtener esquema por ID
   */
  async getById(id: string): Promise<RetentionSchedule> {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Esquema de retención no encontrado: ${id}`);
    }
    return schedule;
  }

  /**
   * PRIV-PBDESIGN-004: Actualizar esquema
   */
  async updateSchedule(
    id: string,
    updates: Partial<CreateRetentionScheduleDto>,
  ): Promise<RetentionSchedule> {
    const schedule = await this.getById(id);

    if (schedule.mandatoryLegalRequirement && updates.retentionDays) {
      throw new BadRequestException(
        'No se puede modificar el período de retención de un esquema con requisito legal obligatorio',
      );
    }

    Object.assign(schedule, updates);
    schedule.nextScheduledRun = this.calculateNextRun(schedule.retentionDays);

    return this.repo.save(schedule);
  }

  /**
   * PRIV-PBDESIGN-004: Activar/desactivar esquema
   */
  async toggleActive(id: string): Promise<RetentionSchedule> {
    const schedule = await this.getById(id);
    schedule.isActive = !schedule.isActive;
    return this.repo.save(schedule);
  }

  /**
   * PRIV-PBDESIGN-005: Ejecutar eliminación automática para esquemas vencidos
   * En producción, esto ejecutaría queries DELETE/UPDATE anónimos
   */
  async executeExpiredRetentions(): Promise<{
    executedSchedules: number;
    totalRecordsProcessed: number;
    details: Array<{ scheduleId: string; table: string; recordsFound: number; action: string }>;
  }> {
    const activeSchedules = await this.repo.find({ where: { isActive: true } });
    const details: Array<{ scheduleId: string; table: string; recordsFound: number; action: string }> = [];
    let totalRecordsProcessed = 0;

    for (const schedule of activeSchedules) {
      // En producción: buscar registros WHERE startDateField < NOW() - retentionDays
      // Por ahora, simulación:
      const mockRecordsFound = Math.floor(Math.random() * 100);

      details.push({
        scheduleId: schedule.id,
        table: schedule.targetTable,
        recordsFound: mockRecordsFound,
        action: schedule.expirationAction,
      });

      totalRecordsProcessed += mockRecordsFound;

      schedule.lastExecutionAt = new Date();
      schedule.recordsProcessedLastRun = mockRecordsFound;
      schedule.nextScheduledRun = this.calculateNextRun(schedule.retentionDays);

      await this.repo.save(schedule);
    }

    this.logger.log(
      `Retención automática ejecutada: ${activeSchedules.length} esquemas, ${totalRecordsProcessed} registros procesados`,
    );

    return {
      executedSchedules: activeSchedules.length,
      totalRecordsProcessed,
      details,
    };
  }

  /**
   * PRIV-PBDESIGN-005: Eliminar esquema de retención
   */
  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getById(id);

    if (schedule.mandatoryLegalRequirement) {
      throw new BadRequestException(
        'No se puede eliminar un esquema con requisito legal obligatorio',
      );
    }

    await this.repo.remove(schedule);
    this.logger.log(`Esquema de retención eliminado: ${id}`);
  }

  /**
   * PRIV-PBDESIGN-005: Aprobar esquema (DPO o admin)
   */
  async approveSchedule(id: string, approverName: string): Promise<RetentionSchedule> {
    const schedule = await this.getById(id);
    schedule.approvedBy = approverName;
    schedule.approvalDate = new Date();
    return this.repo.save(schedule);
  }

  /**
   * Helper: Calcular próxima ejecución
   */
  private calculateNextRun(retentionDays: number): Date {
    // Ejecutar diario para verificar vencimientos
    const next = new Date();
    next.setHours(next.getHours() + 24);
    return next;
  }
}
