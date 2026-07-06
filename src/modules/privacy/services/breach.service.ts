import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BreachNotification } from '../entities/breach-notification.entity';
import { BreachSeverity, BREACH_NOTIFICATION_RULES } from '../entities/breach-severity.enum';
import { BreachStatus, BREACH_TRANSITIONS } from '../entities/breach-status.enum';
import { CreateBreachDto } from '../dto/create-breach.dto';
import { AssessBreachDto } from '../dto/assess-breach.dto';
import { NotifyBreachDto } from '../dto/notify-breach.dto';

/**
 * Servicio de gestión de notificaciones de brecha GDPR Art. 33/34
 * Funciones: PRIV-BREACH-001 a PRIV-BREACH-005
 */
@Injectable()
export class BreachService {
  private readonly logger = new Logger(BreachService.name);

  constructor(
    @InjectRepository(BreachNotification)
    private repo: Repository<BreachNotification>,
  ) {}

  /**
   * PRIV-BREACH-001: Listar todas las brechas
   */
  async listAllBreaches(statusFilter?: BreachStatus): Promise<BreachNotification[]> {
    const where = statusFilter ? { status: statusFilter } : {};
    return this.repo.find({
      where,
      order: { discoveredAt: 'DESC' },
    });
  }

  /**
   * PRIV-BREACH-001: Obtener brecha por ID
   */
  async getById(id: string): Promise<BreachNotification> {
    const breach = await this.repo.findOne({ where: { id } });
    if (!breach) {
      throw new NotFoundException(`Brecha no encontrada: ${id}`);
    }
    return breach;
  }

  /**
   * PRIV-BREACH-001: Crear nueva detección de brecha
   */
  async createBreach(dto: CreateBreachDto): Promise<BreachNotification> {
    const now = new Date();
    
    let notificationDeadline: Date | null = null;
    const severity = dto.initialSeverity || BreachSeverity.MEDIUM;
    if (BREACH_NOTIFICATION_RULES[severity].notifyAuthority) {
      notificationDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    }

    const partial: Partial<BreachNotification> = {
      ...dto,
      discoveredAt: now,
      status: BreachStatus.DETECTED,
      detectionSource: dto.detectionSource || 'manual',
      affectedUserCount: dto.affectedUserCount || 0,
      notificationDeadline: notificationDeadline,
      containedAt: null,
      authorityNotifiedAt: null,
      usersNotifiedAt: null,
      dataCategoriesAffected: dto.dataCategoriesAffected || null,
      forensicHash: null,
      incidentNotes: null,
      rootCause: null,
      remediationActions: null,
      attackCategory: dto.attackCategory || null,
      description: dto.description || null,
      investigatorName: null,
    };

    const saved = await this.repo.save(partial as any);

    this.logger.log(
      `Brecha detectada: id=${saved.id}, título="${saved.title}", severidad=${dto.initialSeverity || 'N/A'}`,
    );

    return saved;
  }

  /**
   * PRIV-BREACH-002: Evaluar severidad y plan de mitigación
   */
  async assessRisk(breachId: string, dto: AssessBreachDto): Promise<BreachNotification> {
    const breach = await this.getById(breachId);

    Object.assign(breach, dto);
    breach.containedAt = new Date();
    breach.status = BreachStatus.ASSESSED;

    const severity = dto.severityLevel;
    if (BREACH_NOTIFICATION_RULES[severity].notifyAuthority) {
      breach.notificationDeadline = new Date(new Date().getTime() + 72 * 60 * 60 * 1000);
    } else {
      breach.notificationDeadline = null;
    }

    this.logger.log(
      `Brecha evaluada: id=${breachId}, severidad=${dto.severityLevel}, afectados=${dto.affectedUserCount}`,
    );

    return this.repo.save(breach);
  }

  /**
   * PRIV-BREACH-003: Notificar a autoridad supervisora dentro de 72h
   */
  async notifySupervisoryAuthority(
    breachId: string,
    dto: NotifyBreachDto,
  ): Promise<BreachNotification> {
    const breach = await this.getById(breachId);

    if (breach.status !== BreachStatus.ASSESSED) {
      throw new BadRequestException(
        'Solo se puede notificar brechas en estado assessed',
      );
    }

    if (BREACH_NOTIFICATION_RULES[breach.severityLevel].slaHours <= 72) {
      const elapsedHours = Math.floor((new Date().getTime() - breach.discoveredAt!.getTime()) / (1000 * 60 * 60));
      if (elapsedHours >= 72) {
        this.logger.warn(
          `Advertencia: Notificación tardía (${elapsedHours} horas) - Riesgo regulatorio`,
        );
      }
    }

    breach.authorityNotifiedAt = new Date();
    breach.status = BreachStatus.NOTIFIED_AUTHORITY;

    if (dto.authorityNotificationNotes) {
      const notes = breach.incidentNotes || '';
      breach.incidentNotes = `${notes}\n\nNotif Autoridad: ${dto.authorityNotificationNotes}`;
    }

    this.logger.log(
      `Autoridad notificada: id=${breachId}, tiempo transcurrido=${Math.floor((new Date().getTime() - breach.discoveredAt!.getTime()) / 3600000)} horas`,
    );

    return this.repo.save(breach);
  }

  /**
   * PRIV-BREACH-004: Notificar usuarios afectados según riesgo residual
   */
  async notifyAffectedUsers(
    breachId: string,
    templateMessage: string,
  ): Promise<BreachNotification> {
    const breach = await this.getById(breachId);

    if (breach.status !== BreachStatus.ASSESSED && breach.status !== BreachStatus.NOTIFIED_AUTHORITY) {
      throw new BadRequestException(
        'No se pueden notificar usuarios hasta estar en estado validado',
      );
    }

    if (!BREACH_NOTIFICATION_RULES[breach.severityLevel].notifyUsers) {
      throw new BadRequestException(
        `La severidad ${breach.severityLevel} no requiere notificar usuarios`,
      );
    }

    if (templateMessage.trim().length < 50) {
      throw new BadRequestException('El mensaje debe ser descriptivo (>50 caracteres)');
    }

    breach.usersNotifiedAt = new Date();
    breach.status = BreachStatus.NOTIFIED_USERS;

    this.logger.log(
      `Usuarios notificados: id=${breachId}, cantidad=${breach.affectedUserCount}`,
    );

    return this.repo.save(breach);
  }

  /**
   * PRIV-BREACH-005: Contener daño (stop loss action)
   */
  async containDamage(
    breachId: string,
    containmentActions: string,
  ): Promise<BreachNotification> {
    const breach = await this.getById(breachId);
    if (!containmentActions) {
      throw new BadRequestException('Se deben especificar acciones de contención');
    }

    breach.containedAt = new Date();
    breach.status = BreachStatus.CONTAINED;

    if (breach.remediationActions) {
      breach.remediationActions += `\nContención: ${containmentActions}`;
    } else {
      breach.remediationActions = containmentActions;
    }

    this.logger.warn(
      `Daño contenido: id=${breachId}, timestamp=${breach.containedAt!.toISOString()}`,
    );

    return this.repo.save(breach);
  }

  /**
   * PRIV-BREACH-002: Listar brechas pendientes de resolver por plazo de ley
   */
  async checkOverdueNotifications(): Promise<BreachNotification[]> {
    const now = new Date();
    
    return this.repo
      .createQueryBuilder('b')
      .where('b."notification_deadline" < :now', { now })
      .andWhere('b.status NOT IN (:...resolvedStatuses)', {
        resolvedStatuses: [BreachStatus.NOTIFIED_AUTHORITY, BreachStatus.RESOLVED, BreachStatus.CLOSED],
      })
      .getMany();
  }

  /**
   * PRIV-BREACH-005: Cerrar caso tras documentación forense completa
   */
  async closeBreachCase(id: string): Promise<BreachNotification> {
    const breach = await this.getById(id);

    const requiredChecks = [
      breach.remediationActions != null,
      breach.rootCause != null,
      breach.forensicHash != null,
      breach.status === BreachStatus.RESOLVED,
    ];

    if (!requiredChecks.every(Boolean)) {
      throw new BadRequestException(
        'Para cerrar, se requiere remediation + root cause + forensic hash + estado resolved',
      );
    }

    breach.status = BreachStatus.CLOSED;

    this.logger.log(`Caso cerrado oficialmente: id=${id}`);

    return this.repo.save(breach);
  }
}
