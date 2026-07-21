import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemittanceInstruction } from '../entities/remittance-instruction.entity';

@Injectable()
export class RemittanceService {
  constructor(
    @InjectRepository(RemittanceInstruction)
    private repo: Repository<RemittanceInstruction>,
  ) {}

  async initiate(data: Partial<RemittanceInstruction>): Promise<RemittanceInstruction> {
    const remittanceNumber = `REM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
    const instruction = this.repo.create({
      ...data,
      remittanceNumber,
      status: 'initiated',
    });
    return this.repo.save(instruction);
  }

  async findById(id: string): Promise<RemittanceInstruction> {
    const instruction = await this.repo.findOne({ where: { id } });
    if (!instruction) throw new NotFoundException(`Remittance ${id} not found`);
    return instruction;
  }

  async findByNumber(remittanceNumber: string): Promise<RemittanceInstruction> {
    const instruction = await this.repo.findOne({ where: { remittanceNumber } });
    if (!instruction) throw new NotFoundException(`Remittance ${remittanceNumber} not found`);
    return instruction;
  }

  async findAll(filters?: { status?: string; customerId?: string }): Promise<RemittanceInstruction[]> {
    const qb = this.repo.createQueryBuilder('r');
    if (filters?.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters?.customerId) {
      qb.andWhere('r.originatingCustomerId = :customerId', { customerId: filters.customerId });
    }
    return qb.orderBy('r.createdAt', 'DESC').getMany();
  }

  async routeOptimize(instructionId: string): Promise<{
    selectedRoute: string;
    estimatedTime: number;
    totalFees: number;
    alternatives: Array<{ route: string; time: number; fees: number; recommendation: string }>;
  }> {
    const instruction = await this.findById(instructionId);

    const routes = [
      { route: 'SWIFT_STANDARD', time: 48, fees: 25, recommendation: 'Best for large amounts' },
      { route: 'SWIFT_GPI', time: 4, fees: 35, recommendation: 'Fastest with tracking' },
      { route: 'CORRIDOR_DIRECT', time: 2, fees: 15, recommendation: 'Best for frequent corridors' },
      { route: 'RTP_INSTANT', time: 0.5, fees: 50, recommendation: 'Instant payment' },
    ];

    let selected = routes[1]; // Default to GPI
    if (instruction.urgency === 'urgent') {
      selected = routes[3];
    } else if (instruction.amountOriginal < 5000) {
      selected = routes[2];
    }

    instruction.selectedRoute = selected.route;
    instruction.totalFeesAmount = selected.fees;
    instruction.routeOptimization = { alternatives: routes, selected: selected.route };
    await this.repo.save(instruction);

    return {
      selectedRoute: selected.route,
      estimatedTime: selected.time,
      totalFees: selected.fees,
      alternatives: routes,
    };
  }

  async execute(instructionId: string): Promise<RemittanceInstruction> {
    const instruction = await this.findById(instructionId);
    if (instruction.status !== 'initiated') {
      throw new BadRequestException(`Cannot execute remittance in status: ${instruction.status}`);
    }
    instruction.status = 'executing';
    instruction.executedAt = new Date();
    return this.repo.save(instruction);
  }

  async confirmExecution(instructionId: string, gpiTrackingId: string): Promise<RemittanceInstruction> {
    const instruction = await this.findById(instructionId);
    instruction.status = 'confirmed';
    instruction.confirmedAt = new Date();
    instruction.gpiTrackingId = gpiTrackingId;
    return this.repo.save(instruction);
  }

  async markBeneficiaryCredited(instructionId: string): Promise<RemittanceInstruction> {
    const instruction = await this.findById(instructionId);
    instruction.status = 'completed';
    instruction.beneficiaryCreditedAt = new Date();
    return this.repo.save(instruction);
  }

  async cancel(instructionId: string, reason: string): Promise<RemittanceInstruction> {
    const instruction = await this.findById(instructionId);
    if (['completed', 'confirmed'].includes(instruction.status)) {
      throw new BadRequestException('Cannot cancel completed remittance');
    }
    instruction.status = 'cancelled';
    instruction.remitterNotes = `Cancelled: ${reason}`;
    return this.repo.save(instruction);
  }

  async getTrackingStatus(instructionId: string): Promise<{
    remittanceNumber: string;
    status: string;
    gpiTrackingId: string | null;
    timeline: Array<{ event: string; timestamp: Date | null }>;
  }> {
    const instruction = await this.findById(instructionId);
    return {
      remittanceNumber: instruction.remittanceNumber,
      status: instruction.status,
      gpiTrackingId: instruction.gpiTrackingId ?? null,
      timeline: [
        { event: 'initiated', timestamp: instruction.createdAt },
        { event: 'executed', timestamp: instruction.executedAt ?? null },
        { event: 'confirmed', timestamp: instruction.confirmedAt ?? null },
        { event: 'beneficiary_credited', timestamp: instruction.beneficiaryCreditedAt ?? null },
      ],
    };
  }

  async calculateLandedCost(instructionId: string): Promise<{
    amountOriginal: number;
    fxRate: number;
    fxAmountSettled: number;
    totalFees: number;
    totalLandedCost: number;
  }> {
    const instruction = await this.findById(instructionId);
    const amount = Number(instruction.amountOriginal);
    const fees = Number(instruction.totalFeesAmount || 0);
    const fxRate = Number(instruction.fxRateUsed || 1);
    const settled = amount * fxRate;
    const landed = settled + fees;

    instruction.fxAmountSettled = settled;
    instruction.totalLandedCost = landed;
    await this.repo.save(instruction);

    return {
      amountOriginal: amount,
      fxRate,
      fxAmountSettled: settled,
      totalFees: fees,
      totalLandedCost: landed,
    };
  }
}
