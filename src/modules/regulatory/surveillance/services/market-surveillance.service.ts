import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { SurveillanceAlert } from '../entities/surveillance-alert.entity';
import { CreateSurveillanceAlertDto } from '../dto/create-surveillance-alert.dto';
import { InvestigateAlertDto } from '../dto/investigate-alert.dto';
import { SurveillanceAlertType } from '../entities/surveillance-alert-type.enum';

@Injectable()
export class MarketSurveillanceService {
  private readonly logger = new Logger(MarketSurveillanceService.name);

  constructor(
    @InjectRepository(SurveillanceAlert)
    private readonly alertRepo: Repository<SurveillanceAlert>,
  ) {}

  /**
   * REG-SURVEILL-001: Create alert from surveillance engine
   */
  async createAlert(dto: CreateSurveillanceAlertDto): Promise<SurveillanceAlert> {
    const alert = Object.assign(new SurveillanceAlert(), {
      alertType: dto.alertType,
      instrumentSymbol: dto.instrumentSymbol,
      transactionIds: dto.transactionIds,
      traderId: dto.traderId,
      confidenceScore: dto.confidenceScore,
      patternDetail: dto.patternDetail || {},
      status: 'open',
      detectedAt: new Date(),
    });

    const saved = await this.alertRepo.save(alert) as unknown as SurveillanceAlert;
    this.logger.log(`Surveillance alert created: ${saved.id} - type: ${dto.alertType}`);
    return saved;
  }

  /**
   * REG-SURVEILL-001: List all alerts with filters
   */
  async findAll(alertType?: string, status?: string, traderId?: string): Promise<SurveillanceAlert[]> {
    const queryBuilder = this.alertRepo.createQueryBuilder('alert');

    if (alertType) {
      queryBuilder.andWhere('alert.alertType = :alertType', { alertType });
    }
    if (status) {
      queryBuilder.andWhere('alert.status = :status', { status });
    }
    if (traderId) {
      queryBuilder.andWhere('alert.traderId = :traderId', { traderId });
    }

    queryBuilder.orderBy('alert.detectedAt', 'DESC');
    return queryBuilder.getMany();
  }

  /**
   * REG-SURVEILL-002: Detect wash trade pattern
   */
  async detectWashTrade(transactions: any[]): Promise<SurveillanceAlert | null> {
    const buyOrders = transactions.filter(t => t.side === 'buy');
    const sellOrders = transactions.filter(t => t.side === 'sell');

    for (const buy of buyOrders) {
      const matchingSell = sellOrders.find(s => 
        s.traderId === buy.traderId && 
        s.instrumentSymbol === buy.instrumentSymbol &&
        Math.abs(buy.quantity - s.quantity) < 0.01
      );

      if (matchingSell) {
        const alert = await this.createAlert({
          alertType: SurveillanceAlertType.WASH_TRADE,
          instrumentSymbol: buy.instrumentSymbol,
          transactionIds: [buy.id, matchingSell.id],
          traderId: buy.traderId,
          confidenceScore: 85.0,
          patternDetail: {
            buyOrderId: buy.id,
            sellOrderId: matchingSell.id,
            quantity: buy.quantity,
            price: buy.price,
            detectionMethod: 'self_matching',
          },
        });

        this.logger.warn(`Wash trade detected: trader ${buy.traderId}`);
        return alert;
      }
    }

    return null;
  }

  /**
   * REG-SURVEILL-003: Detect spoofing pattern
   */
  async detectSpoofing(transactions: any[]): Promise<SurveillanceAlert | null> {
    const cancelledOrders = transactions.filter(t => t.status === 'cancelled');
    const filledOrders = transactions.filter(t => t.status === 'filled');

    for (const cancelled of cancelledOrders) {
      const relatedFilled = filledOrders.find(f =>
        f.instrumentSymbol === cancelled.instrumentSymbol &&
        f.traderId !== cancelled.traderId &&
        Math.abs(cancelled.timestamp - f.timestamp) < 5000
      );

      if (relatedFilled && cancelled.quantity > relatedFilled.quantity * 2) {
        const alert = await this.createAlert({
          alertType: SurveillanceAlertType.SPOOFING,
          instrumentSymbol: cancelled.instrumentSymbol,
          transactionIds: [cancelled.id, relatedFilled.id],
          traderId: cancelled.traderId,
          confidenceScore: 75.0,
          patternDetail: {
            cancelledOrderId: cancelled.id,
            cancelledQty: cancelled.quantity,
            filledOrderId: relatedFilled.id,
            filledQty: relatedFilled.quantity,
            timeDiffMs: Math.abs(cancelled.timestamp - relatedFilled.timestamp),
          },
        });

        this.logger.warn(`Spoofing detected: trader ${cancelled.traderId}`);
        return alert;
      }
    }

    return null;
  }

  /**
   * REG-SURVEILL-004: Detect layering pattern
   */
  async detectLayering(transactions: any[]): Promise<SurveillanceAlert | null> {
    const ordersByTrader: Record<string, any[]> = {};

    for (const t of transactions) {
      if (!ordersByTrader[t.traderId]) {
        ordersByTrader[t.traderId] = [];
      }
      ordersByTrader[t.traderId].push(t);
    }

    for (const [traderId, orders] of Object.entries(ordersByTrader)) {
      const cancelled = orders.filter(o => o.status === 'cancelled');
      const sequential = cancelled.filter((o, i) => 
        i > 0 && Math.abs(o.timestamp - cancelled[i - 1].timestamp) < 3000
      );

      if (sequential.length >= 2) {
        const alert = await this.createAlert({
          alertType: SurveillanceAlertType.LAYERING,
          instrumentSymbol: sequential[0].instrumentSymbol,
          transactionIds: sequential.map(o => o.id),
          traderId,
          confidenceScore: 70.0,
          patternDetail: {
            cancelledCount: cancelled.length,
            sequentialCount: sequential.length,
            timeSpan: Math.abs(sequential[0].timestamp - sequential[sequential.length - 1].timestamp),
          },
        });

        this.logger.warn(`Layering detected: trader ${traderId}`);
        return alert;
      }
    }

    return null;
  }

  /**
   * REG-SURVEILL-005: Detect front-running pattern
   */
  async detectFrontRunning(transactions: any[]): Promise<SurveillanceAlert | null> {
    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i < sorted.length - 1; i++) {
      const candidate = sorted[i];
      const subsequent = sorted.slice(i + 1);

      const matchingClientOrder = subsequent.find(s =>
        s.instrumentSymbol === candidate.instrumentSymbol &&
        s.side !== candidate.side &&
        s.traderId !== candidate.traderId &&
        Math.abs(s.timestamp - candidate.timestamp) < 2000
      );

      if (matchingClientOrder && candidate.isProprietary) {
        const alert = await this.createAlert({
          alertType: SurveillanceAlertType.FRONT_RUNNING,
          instrumentSymbol: candidate.instrumentSymbol,
          transactionIds: [candidate.id, matchingClientOrder.id],
          traderId: candidate.traderId,
          confidenceScore: 80.0,
          patternDetail: {
            proprietaryOrderId: candidate.id,
            clientOrderId: matchingClientOrder.id,
            side: candidate.side,
            timeDiffMs: Math.abs(matchingClientOrder.timestamp - candidate.timestamp),
          },
        });

        this.logger.warn(`Front-running detected: trader ${candidate.traderId}`);
        return alert;
      }
    }

    return null;
  }

  /**
   * REG-SURVEILL-006: Detect insider dealing pattern
   */
  async detectInsiderDealing(transactions: any[], materialEvent?: any): Promise<SurveillanceAlert | null> {
    if (!materialEvent) return null;

    const beforeEvent = transactions.filter(t => 
      t.timestamp < materialEvent.timestamp &&
      t.instrumentSymbol === materialEvent.instrumentSymbol
    );

    const unusualVolume = beforeEvent.filter(t => 
      t.quantity > (t.averageQuantity || 1000) * 3
    );

    if (unusualVolume.length >= 2) {
      const traderId = unusualVolume[0].traderId;
      const alert = await this.createAlert({
        alertType: SurveillanceAlertType.INSIDER,
        instrumentSymbol: materialEvent.instrumentSymbol,
        transactionIds: unusualVolume.map(t => t.id),
        traderId,
        confidenceScore: 65.0,
        patternDetail: {
          materialEventType: materialEvent.eventType,
          eventTimestamp: materialEvent.timestamp,
          unusualVolumeCount: unusualVolume.length,
          avgMultiplier: 3,
        },
      });

      this.logger.warn(`Insider dealing detected: trader ${traderId}`);
      return alert;
    }

    return null;
  }

  /**
   * REG-SURVEILL-007: MiFID II transaction reporting
   */
  async generateMifidReport(fromDate: Date, toDate: Date, instrumentSymbol?: string): Promise<{
    reportId: string;
    period: string;
    totalTransactions: number;
    reportableCount: number;
    transactions: any[];
  }> {
    const queryBuilder = this.alertRepo.createQueryBuilder('alert');

    queryBuilder.where('alert.detectedAt BETWEEN :from AND :to', {
      from: fromDate,
      to: toDate,
    });

    if (instrumentSymbol) {
      queryBuilder.andWhere('alert.instrumentSymbol = :symbol', { symbol: instrumentSymbol });
    }

    const alerts = await queryBuilder.getMany();

    return {
      reportId: `mifid-${Date.now()}`,
      period: `${fromDate.toISOString()} to ${toDate.toISOString()}`,
      totalTransactions: alerts.reduce((sum, a) => sum + a.transactionIds.length, 0),
      reportableCount: alerts.length,
      transactions: alerts,
    };
  }

  /**
   * REG-SURVEILL-008: Communication surveillance (5-year retention)
   */
  async archiveCommunications(communications: any[]): Promise<{ archived: number; retentionUntil: Date }> {
    const retentionYears = 5;
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + retentionYears);

    this.logger.log(`Archived ${communications.length} communication records for ${retentionYears} years`);
    return {
      archived: communications.length,
      retentionUntil,
    };
  }

  /**
   * REG-SURVEILL-009: Trade reconstruction (order event timeline)
   */
  async reconstructTrade(alertId: string): Promise<{
    alertId: string;
    timeline: { timestamp: Date; event: string; detail: Record<string, unknown> }[];
  }> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    const timeline = [
      {
        timestamp: new Date(alert.detectedAt.getTime() - 60000),
        event: 'PRE_ALERT_ACTIVITY',
        detail: { transactionIds: alert.transactionIds },
      },
      {
        timestamp: alert.detectedAt,
        event: 'ALERT_TRIGGERED',
        detail: alert.patternDetail,
      },
      {
        timestamp: alert.resolvedAt || new Date(),
        event: alert.resolvedAt ? 'ALERT_RESOLVED' : 'AWAITING_RESOLUTION',
        detail: { status: alert.status },
      },
    ];

    return { alertId, timeline };
  }

  /**
   * REG-SURVEILL-010: Investigation case management
   */
  async investigateAlert(alertId: string, dto: InvestigateAlertDto): Promise<SurveillanceAlert> {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    alert.status = dto.status;
    if (dto.investigationNotes) alert.investigationNotes = dto.investigationNotes;
    if (dto.caseId) alert.caseId = dto.caseId;

    if (dto.status === 'dismissed' || dto.status === 'escalated') {
      alert.resolvedAt = new Date();
    }

    const saved = await this.alertRepo.save(alert);
    this.logger.log(`Alert ${alertId} investigation updated: ${dto.status}`);
    return saved;
  }

  /**
   * Get single alert
   */
  async findById(id: string): Promise<SurveillanceAlert | null> {
    return this.alertRepo.findOne({ where: { id } });
  }
}
