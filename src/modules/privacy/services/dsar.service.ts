import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DsarRequest } from '../entities/dsar-request.entity';
import { DsarRequestType, DSAR_DEADLINE_DAYS } from '../entities/dsar-request-type.enum';
import { DsarStatus, DSAR_TRANSITIONS } from '../entities/dsar-status.enum';
import { DsarReceivedChannel } from '../entities/dsar-received-channel.enum';
import { CreateDsarRequestDto } from '../dto/create-dsar-request.dto';
import { DsarReviewDto } from '../dto/dsar-review.dto';

/**
 * Servicio de gestión de solicitudes DSAR (Data Subject Access Request)
 * Cubre funciones: PRIV-DSAR-001 a PRIV-DSAR-010
 */
@Injectable()
export class DsarService {
  private readonly logger = new Logger(DsarService.name);

  constructor(
    @InjectRepository(DsarRequest)
    private readonly dsarRepo: Repository<DsarRequest>,
  ) {}

  /**
   * PRIV-DSAR-001: Crear solicitud DSAR multi-canal
   */
  async createRequest(
    userId: string,
    dto: CreateDsarRequestDto,
  ): Promise<DsarRequest> {
    const deadlineDays = DSAR_DEADLINE_DAYS[dto.requestType];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    const request = this.dsarRepo.create({
      userId,
      requestType: dto.requestType,
      status: DsarStatus.RECEIVED,
      receivedChannel: dto.receivedChannel || DsarReceivedChannel.WEB,
      deadline,
      reviewNotes: dto.notes || null,
    });

    const saved = await this.dsarRepo.save(request);

    this.logger.log(
      `DSAR creada: id=${saved.id}, usuario=${userId}, tipo=${dto.requestType}, deadline=${deadline.toISOString()}`,
    );

    return saved;
  }

  /**
   * PRIV-DSAR-004: Obtener estado de solicitud DSAR
   */
  async getStatus(requestId: string, userId?: string): Promise<DsarRequest> {
    const where: Record<string, unknown> = { id: requestId };
    if (userId) {
      where.userId = userId;
    }

    const request = await this.dsarRepo.findOne({ where });

    if (!request) {
      throw new NotFoundException(`Solicitud DSAR no encontrada: ${requestId}`);
    }

    return request;
  }

  /**
   * PRIV-DSAR-004: Listar solicitudes DSAR de un usuario
   */
  async listUserRequests(userId: string): Promise<DsarRequest[]> {
    return this.dsarRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PRIV-DSAR-004: Listar todas las solicitudes (admin/DPO)
   */
  async listAllRequests(statusFilter?: DsarStatus): Promise<DsarRequest[]> {
    const where = statusFilter ? { status: statusFilter } : {};
    return this.dsarRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PRIV-DSAR-001: Actualizar estado de solicitud DSAR (DPO)
   */
  async updateStatus(
    requestId: string,
    dto: DsarReviewDto,
  ): Promise<DsarRequest> {
    const request = await this.dsarRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud DSAR no encontrada: ${requestId}`);
    }

    // Validar transición de estado
    const validNextStates = DSAR_TRANSITIONS[request.status];
    if (!validNextStates.includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${request.status} → ${dto.status}. Válidas: ${validNextStates.join(', ')}`,
      );
    }

    request.status = dto.status;

    if (dto.reviewNotes) {
      request.reviewNotes = dto.reviewNotes;
    }

    if (dto.status === DsarStatus.DELIVERED || dto.status === DsarStatus.CLOSED) {
      request.completedAt = new Date();
    }

    this.logger.log(
      `DSAR actualizada: id=${requestId}, estado=${dto.status}`,
    );

    return this.dsarRepo.save(request);
  }

  /**
   * PRIV-DSAR-002 + 003: Compilar paquete de datos del usuario
   * (simulación — en producción buscaría en todas las tablas)
   */
  async compileDataPackage(requestId: string): Promise<DsarRequest> {
    const request = await this.dsarRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud DSAR no encontrada: ${requestId}`);
    }

    if (request.status !== DsarStatus.PROCESSING && request.status !== DsarStatus.RECEIVED) {
      throw new BadRequestException(
        `La solicitud debe estar en estado received o processing, actual: ${request.status}`,
      );
    }

    // Marcar como processing si aún no lo está
    if (request.status === DsarStatus.RECEIVED) {
      request.status = DsarStatus.PROCESSING;
      await this.dsarRepo.save(request);
    }

    // Simulación de compilación de paquete
    // En producción: buscar en identity_users, ledger_accounts, chat_conversations, etc.
    const mockData = {
      exportedAt: new Date().toISOString(),
      requestId,
      userId: request.userId,
      requestType: request.requestType,
      notice: 'Paquete de datos generado en modo simulación. En producción se compilarían datos de todas las tablas.',
    };

    const packageJson = JSON.stringify(mockData, null, 2);
    const packageSize = Buffer.byteLength(packageJson, 'utf8');

    request.dataPackageUrl = `privacy://dsar/${requestId}/data-package.json`;
    request.dataPackageSize = packageSize;
    request.status = DsarStatus.READY;

    this.logger.log(
      `Paquete DSAR compilado: id=${requestId}, tamaño=${packageSize} bytes`,
    );

    return this.dsarRepo.save(request);
  }

  /**
   * PRIV-DSAR-003: Descargar paquete de datos
   */
  async downloadDataPackage(requestId: string, userId?: string): Promise<{
    url: string;
    size: number;
    requestType: string;
  }> {
    const request = await this.getStatus(requestId, userId);

    if (request.status !== DsarStatus.READY && request.status !== DsarStatus.DELIVERED) {
      throw new BadRequestException(
        `El paquete no está listo. Estado actual: ${request.status}`,
      );
    }

    if (!request.dataPackageUrl) {
      throw new BadRequestException('Paquete sin URL de descarga');
    }

    // Marcar como entregado si era ready
    if (request.status === DsarStatus.READY) {
      request.status = DsarStatus.DELIVERED;
      request.completedAt = new Date();
      await this.dsarRepo.save(request);
    }

    return {
      url: request.dataPackageUrl,
      size: request.dataPackageSize || 0,
      requestType: request.requestType,
    };
  }

  /**
   * PRIV-DSAR-005: Validar si se puede ejecutar erasure
   * Verifica obligaciones legales de retención
   */
  async validateErasure(userId: string): Promise<{
    canErase: boolean;
    blockers: string[];
  }> {
    const blockers: string[] = [];

    // Verificar si hay solicitudes DSAR activas
    const activeRequests = await this.dsarRepo.count({
      where: { userId, requestType: DsarRequestType.ACCESS },
    });

    // En producción se verificaría:
    // - Obligaciones de retención financiera (5 años)
    // - Investigaciones AML activas
    // - Litigios pendientes
    // - Regulaciones específicas por jurisdicción

    // Por ahora, simulación simple
    const mockRetentionObligations = [
      'transactions: 5 años (regulación bancaria)',
      'audit_logs: 7 años (SOX compliance)',
    ];

    return {
      canErase: blockers.length === 0,
      blockers: [...blockers, ...mockRetentionObligations],
    };
  }

  /**
   * PRIV-DSAR-005 + 006: Ejecutar solicitud de erasure
   */
  async executeErasure(requestId: string): Promise<DsarRequest> {
    const request = await this.dsarRepo.findOne({
      where: { id: requestId, requestType: DsarRequestType.ERASURE },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud de erasure no encontrada: ${requestId}`);
    }

    const validation = await this.validateErasure(request.userId);

    if (!validation.canErase) {
      request.status = DsarStatus.REJECTED;
      request.reviewNotes = `Bloqueado por retención legal: ${validation.blockers.join(', ')}`;
      await this.dsarRepo.save(request);

      this.logger.warn(
        `Erasure bloqueado: id=${requestId}, blockers=${validation.blockers.join('; ')}`,
      );

      return request;
    }

    // En producción: ejecutar cascade delete/anonymize
    request.status = DsarStatus.PROCESSING;
    request.reviewNotes = 'Erasure en progreso — datos siendo anonimizados según retención legal';
    await this.dsarRepo.save(request);

    // Simular completitud
    request.status = DsarStatus.READY;
    request.completedAt = new Date();
    request.dataPackageUrl = `privacy://dsar/${requestId}/erasure-confirmation.json`;
    request.reviewNotes = 'Erasure completado. Datos anonimizados conservados según obligación legal.';

    this.logger.log(
      `Erasure completado: id=${requestId}, usuario=${request.userId}`,
    );

    return this.dsarRepo.save(request);
  }

  /**
   * PRIV-DSAR-004: Verificar solicitudes DSAR vencidas
   */
  async checkOverdueRequests(): Promise<DsarRequest[]> {
    const now = new Date();
    const overdue = await this.dsarRepo
      .createQueryBuilder('dsar')
      .where('dsar.deadline < :now', { now })
      .andWhere('dsar.status NOT IN (:...closedStatuses)', {
        closedStatuses: [DsarStatus.DELIVERED, DsarStatus.CLOSED, DsarStatus.REJECTED],
      })
      .getMany();

    if (overdue.length > 0) {
      this.logger.warn(
        `${overdue.length} solicitudes DSAR vencidas detectadas`,
      );
    }

    return overdue;
  }
}
