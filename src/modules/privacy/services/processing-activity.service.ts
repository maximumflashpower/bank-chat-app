import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyProcessingActivity as ProcessingActivity } from '../entities/privacy-processing-activity.entity';
import { CreateProcessingActivityDto } from '../dto/create-processing-activity.dto';
import { UpdateProcessingActivityDto } from '../dto/update-processing-activity.dto';

/**
 * Servicio de gestión de actividades de procesamiento Art 30 GDPR
 * Funciones: PRIV-ART30-001 a PRIV-ART30-005
 */
@Injectable()
export class ProcessingActivityService {
  private readonly logger = new Logger(ProcessingActivityService.name);

  constructor(
    @InjectRepository(ProcessingActivity)
    private readonly repo: Repository<ProcessingActivity>,
  ) {}

  /**
   * PRIV-ART30-001: Listar todas las actividades de procesamiento
   */
  async listAllActivities(): Promise<ProcessingActivity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * PRIV-ART30-001: Obtener actividad por ID
   */
  async getById(id: string): Promise<ProcessingActivity> {
    const activity = await this.repo.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Actividad no encontrada: ${id}`);
    }
    return activity;
  }

  /**
   * PRIV-ART30-002: Crear nueva actividad de procesamiento
   */
  async createActivity(dto: CreateProcessingActivityDto): Promise<ProcessingActivity> {
    // Validar que la base legal sea compatible con las categorías
    if (dto.dataCategories.includes('special_category')) {
      if (dto.legalBasis !== 'consent' && dto.legalBasis !== 'legitimate_interest') {
        this.logger.warn(
          `Actividad con categoría especial requiere consent o legitimate_interest, actual: ${dto.legalBasis}`,
        );
      }
    }

    const activity = this.repo.create({
      ...dto,
      dpoApproved: false,
    });

    const saved = await this.repo.save(activity);

    this.logger.log(
      `Actividad de procesamiento creada: ${saved.activityName}, propósito=${saved.purpose}`,
    );

    return saved;
  }

  /**
   * PRIV-ART30-002: Actualizar actividad existente
   */
  async updateActivity(
    id: string,
    dto: UpdateProcessingActivityDto,
  ): Promise<ProcessingActivity> {
    const activity = await this.getById(id);

    Object.assign(activity, dto);

    // Resetear aprobación DPO si cambian datos sensibles
    if (dto.purpose || dto.dataCategories || dto.legalBasis) {
      activity.dpoApproved = false;
    }

    const updated = await this.repo.save(activity);

    this.logger.log(`Actividad actualizada: ${updated.id}`);

    return updated;
  }

  /**
   * PRIV-ART30-004: Eliminar actividad (soft delete en producción)
   */
  async deleteActivity(id: string): Promise<void> {
    const activity = await this.getById(id);
    await this.repo.remove(activity);

    this.logger.log(`Actividad eliminada: ${id}`);
  }

  /**
   * PRIV-ART30-002: Filtrar actividades por categoría de titular
   */
  async findBySubject(subject: string): Promise<ProcessingActivity[]> {
    return this.repo
      .createQueryBuilder('pa')
      .where('"dataSubjects" LIKE :subject', { subject: `%${subject}%` })
      .getMany();
  }

  /**
   * PRIV-ART30-005: Activar mecanismo de transferencia internacional
   */
  async setTransferCountries(
    id: string,
    countries: string[],
  ): Promise<ProcessingActivity> {
    const activity = await this.getById(id);
    activity.transferCountries = countries;
    activity.dpoApproved = false; // Requerir re-aprobación

    const updated = await this.repo.save(activity);

    this.logger.warn(
      `Actividad modificada para incluir transferencias internacionales: ${countries.join(', ')}`,
    );

    return updated;
  }

  /**
   * PRIV-ART30-003: Exportar registro para auditoría regulatoria
   */
  async exportForAudit(filterCriteria?: {
    dpoApproved?: boolean;
    hasTransfers?: boolean;
  }): Promise<{
    totalActivities: number;
    approvedCount: number;
    internationalTransfers: number;
    activities: ProcessingActivity[];
  }> {
    let query = this.repo.createQueryBuilder('pa');

    if (filterCriteria?.dpoApproved !== undefined) {
      query = query.andWhere('pa."dpoApproved" = :approved', {
        approved: filterCriteria.dpoApproved,
      });
    }

    if (filterCriteria?.hasTransfers === true) {
      query = query.where('pa."transferCountries" IS NOT NULL AND cardinality(pa."transferCountries") > 0');
    }

    const activities = await query.getMany();

    return {
      totalActivities: activities.length,
      approvedCount: activities.filter((a) => a.dpoApproved).length,
      internationalTransfers: activities.filter((a) => a.transferCountries && a.transferCountries.length > 0).length,
      activities,
    };
  }
}
