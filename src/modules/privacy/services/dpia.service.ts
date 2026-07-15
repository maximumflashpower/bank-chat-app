import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyDpiaAssessment as Dpia } from '../entities/privacy-dpia-assessment.entity';
import { PrivacyProcessingActivity as ProcessingActivity } from '../entities/privacy-processing-activity.entity';
import { DpiaStatus } from '../entities/dpia-status.enum';
import { DpiaRiskLevel } from '../entities/dpia-risk-level.enum';
import { CreateDpiaDto } from '../dto/create-dpia.dto';
import { ReviewDpiaDto } from '../dto/review-dpia.dto';

/**
 * Servicio de gestión de DPIA (Data Protection Impact Assessment)
 * Funciones: PRIV-DPIA-001 a PRIV-DPIA-003
 */
@Injectable()
export class DpiaService {
  private readonly logger = new Logger(DpiaService.name);

  constructor(
    @InjectRepository(Dpia)
    private readonly dpiaRepo: Repository<Dpia>,
    @InjectRepository(ProcessingActivity)
    private readonly activityRepo: Repository<ProcessingActivity>,
  ) {}

  /**
   * PRIV-DPIA-001: Crear DPIA para actividad de procesamiento
   */
  async createDpia(dto: CreateDpiaDto): Promise<Dpia> {
    const activity = await this.activityRepo.findOne({
      where: { id: dto.activityId },
    });

    if (!activity) {
      throw new NotFoundException(`Actividad no encontrada: ${dto.activityId}`);
    }

    const dpia = new Dpia();
    dpia.activityId = dto.activityId;
    dpia.riskLevel = dto.riskLevel;
    dpia.riskDescription = dto.riskDescription || null;
    dpia.mitigationMeasures = dto.mitigationMeasures || null;
    dpia.residualRisk = dto.residualRisk || null;
    dpia.consultedDpo = false;
    dpia.dpoOpinion = null;
    dpia.supervisoryAuthorityNotified = false;
    dpia.status = DpiaStatus.DRAFT;
    dpia.createdBy = dto.createdBy;

    const saved = await this.dpiaRepo.save(dpia);

    this.logger.log(
      `DPIA creada: id=${saved.id}, actividad=${dto.activityId}, riesgo=${dto.riskLevel}`,
    );

    return saved;
  }

  /**
   * PRIV-DPIA-001: Obtener DPIA por ID
   */
  async getById(id: string): Promise<Dpia> {
    const dpia = await this.dpiaRepo.findOne({
      where: { id },
    });

    if (!dpia) {
      throw new NotFoundException(`DPIA no encontrada: ${id}`);
    }

    return dpia;
  }

  /**
   * PRIV-DPIA-002: Evaluar nivel de riesgo y plan de mitigación
   */
  async evaluateRisk(
    id: string,
    riskLevel: DpiaRiskLevel,
    riskDescription: string,
    mitigationMeasures: string,
    residualRisk?: DpiaRiskLevel,
  ): Promise<Dpia> {
    const dpia = await this.getById(id);

    if (dpia.status === DpiaStatus.APPROVED) {
      throw new BadRequestException('No se puede modificar un DPIA ya aprobado');
    }

    dpia.riskLevel = riskLevel;
    dpia.riskDescription = riskDescription;
    dpia.mitigationMeasures = mitigationMeasures;
    if (residualRisk) {
      dpia.residualRisk = residualRisk;
    }

    this.logger.log(
      `DPIA evaluada: id=${id}, riesgo=${riskLevel}, residual=${residualRisk || 'N/A'}`,
    );

    return this.dpiaRepo.save(dpia);
  }

  /**
   * PRIV-DPIA-003: Consulta obligatoria al DPO para alto riesgo
   */
  async consultDpo(
    id: string,
    dpoOpinion: string,
  ): Promise<Dpia> {
    const dpia = await this.getById(id);

    if (dpia.riskLevel === DpiaRiskLevel.HIGH && !dpia.consultedDpo) {
      this.logger.warn(
        `DPIA de alto riesgo requiere consulta DPO: id=${id}`,
      );
    }

    dpia.consultedDpo = true;
    dpia.dpoOpinion = dpoOpinion;
    dpia.status = DpiaStatus.IN_REVIEW;

    this.logger.log(
      `DPO consultado para DPIA: id=${id}, opinión registrada`,
    );

    return this.dpiaRepo.save(dpia);
  }

  /**
   * PRIV-DPIA-001: Revisión y cambio de estado del DPIA
   */
  async reviewDpia(id: string, dto: ReviewDpiaDto): Promise<Dpia> {
    const dpia = await this.getById(id);

    if (dpia.status === DpiaStatus.APPROVED) {
      throw new BadRequestException('DPIA ya aprobado no se puede modificar');
    }

    if (
      dto.status === DpiaStatus.APPROVED &&
      dpia.riskLevel === DpiaRiskLevel.HIGH &&
      !dpia.consultedDpo
    ) {
      throw new BadRequestException(
        'No se puede aprobar DPIA de alto riesgo sin consulta previa al DPO',
      );
    }

    if (dto.status !== undefined) dpia.status = dto.status;
    if (dto.consultedDpo !== undefined) dpia.consultedDpo = dto.consultedDpo;
    if (dto.dpoOpinion !== undefined) dpia.dpoOpinion = dto.dpoOpinion;
    if (dto.supervisoryAuthorityNotified !== undefined)
      dpia.supervisoryAuthorityNotified = dto.supervisoryAuthorityNotified;
    if (dto.residualRisk !== undefined) dpia.residualRisk = dto.residualRisk;

    if (dto.status === DpiaStatus.APPROVED) {
      await this.activityRepo.update(
        { id: dpia.activityId },
        { dpoApproved: true },
      );
      this.logger.log(`Actividad marcada como DPO-approved: ${dpia.activityId}`);
    }

    this.logger.log(`DPIA revisada: id=${id}, estado=${dto.status || dpia.status}`);

    return this.dpiaRepo.save(dpia);
  }

  /**
   * PRIV-DPIA-001: Listar DPIAs (opcionalmente filtrados por estado)
   */
  async listDpias(statusFilter?: DpiaStatus): Promise<Dpia[]> {
    const where = statusFilter ? { status: statusFilter } : {};
    return this.dpiaRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PRIV-DPIA-002: Listar DPIAs de alto riesgo pendientes
   */
  async listHighRiskPending(): Promise<Dpia[]> {
    return this.dpiaRepo.find({
      where: { riskLevel: DpiaRiskLevel.HIGH, status: DpiaStatus.DRAFT },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * PRIV-DPIA-003: Notificar a autoridad supervisora
   */
  async notifySupervisoryAuthority(id: string): Promise<Dpia> {
    const dpia = await this.getById(id);

    if (dpia.riskLevel !== DpiaRiskLevel.HIGH) {
      throw new BadRequestException(
        'Solo DPIAs de alto riesgo requieren notificación a autoridad',
      );
    }

    if (!dpia.consultedDpo) {
      throw new BadRequestException(
        'Debe consultarse al DPO antes de notificar a autoridad',
      );
    }

    dpia.supervisoryAuthorityNotified = true;

    this.logger.warn(
      `Autoridad supervisora notificada: DPIA=${id}, actividad=${dpia.activityId}`,
    );

    return this.dpiaRepo.save(dpia);
  }
}
