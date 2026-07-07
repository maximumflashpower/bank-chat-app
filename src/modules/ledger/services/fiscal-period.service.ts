import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { LedgerFiscalPeriod } from '../entities/ledger_fiscal_period.entity';
import { FiscalPeriodStatus } from '../entities/fiscal-period-status.enum';
import { FiscalPeriodType } from '../entities/fiscal-period-type.enum';
import { ClosePeriodDto } from '../dto/close-period.dto';
import { ReopenPeriodDto } from '../dto/reopen-period.dto';

@Injectable()
export class FiscalPeriodService {
  private readonly logger = new Logger(FiscalPeriodService.name);

  constructor(
    @InjectRepository(LedgerFiscalPeriod)
    private periodRepo: Repository<LedgerFiscalPeriod>,
  ) {}

  async findAll(): Promise<LedgerFiscalPeriod[]> {
    return this.periodRepo.find({ order: { start_date: 'DESC' } });
  }

  async findById(id: string): Promise<LedgerFiscalPeriod> {
    const period = await this.periodRepo.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }
    return period;
  }

  async findOpenPeriods(): Promise<LedgerFiscalPeriod[]> {
    return this.periodRepo.find({ where: { status: FiscalPeriodStatus.OPEN }, order: { start_date: 'ASC' } });
  }

  async create(data: {
    period_name: string;
    fiscal_year: number;
    period_number: number;
    start_date: Date;
    end_date: Date;
    period_type: FiscalPeriodType;
  }): Promise<LedgerFiscalPeriod> {
    const existing = await this.periodRepo.findOne({ where: { period_name: data.period_name } });
    if (existing) {
      throw new BadRequestException(`Period ${data.period_name} already exists`);
    }

    const period = this.periodRepo.create(data);
    const saved = await this.periodRepo.save(period);
    this.logger.log(`Fiscal period created: ${saved.period_name}`);
    return saved;
  }

  async close(dto: ClosePeriodDto, userId: string): Promise<LedgerFiscalPeriod> {
    const period = await this.findById(dto.period_id);
    if (period.status === FiscalPeriodStatus.CLOSED || period.status === FiscalPeriodStatus.PERMANENT) {
      throw new BadRequestException(`Period ${period.period_name} is already closed`);
    }

    period.status = dto.permanent ? FiscalPeriodStatus.PERMANENT : FiscalPeriodStatus.CLOSED;
    period.closed_by = userId;
    period.closed_at = new Date();
    return this.periodRepo.save(period);
  }

  async reopen(dto: ReopenPeriodDto, userId: string): Promise<LedgerFiscalPeriod> {
    const period = await this.findById(dto.period_id);
    if (period.status === FiscalPeriodStatus.OPEN) {
      throw new BadRequestException(`Period ${period.period_name} is already open`);
    }
    if (period.status === FiscalPeriodStatus.PERMANENT) {
      throw new BadRequestException(`Period ${period.period_name} is permanently closed and cannot be reopened`);
    }

    period.status = FiscalPeriodStatus.OPEN;
    period.closed_by = null;
    period.closed_at = null;
    period.reopen_count += 1;
    this.logger.warn(`Period ${period.period_name} reopened by ${userId}. Justification: ${dto.justification}`);
    return this.periodRepo.save(period);
  }

  async getStatus(): Promise<{ open: number; closed: number; permanent: number }> {
    const periods = await this.periodRepo.find();
    return {
      open: periods.filter(p => p.status === FiscalPeriodStatus.OPEN).length,
      closed: periods.filter(p => p.status === FiscalPeriodStatus.CLOSED).length,
      permanent: periods.filter(p => p.status === FiscalPeriodStatus.PERMANENT).length,
    };
  }
}
