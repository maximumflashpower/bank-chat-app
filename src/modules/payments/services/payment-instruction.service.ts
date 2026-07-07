import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayInstruction } from '../entities/pay-instruction.entity';
import { CreatePaymentInstructionDto } from '../dto/create-payment-instruction.dto';
import { ApprovePaymentDto } from '../dto/approve-payment.dto';
import { ExecutePaymentDto } from '../dto/execute-payment.dto';

@Injectable()
export class PaymentInstructionService {
  constructor(
    @InjectRepository(PayInstruction)
    private repo: Repository<PayInstruction>,
  ) {}

  async create(dto: CreatePaymentInstructionDto): Promise<PayInstruction> {
    const instructionNumber = this.generateInstructionNumber();
    const instruction = this.repo.create({
      ...dto,
      instructionNumber,
      approvalStatus: 'pending',
      currentApproverLevel: 1,
      totalApprovalLevels: this.determineApprovalLevels(dto.amountOriginal),
      statusHistory: [{ status: 'created', timestamp: new Date() }],
    });
    return this.repo.save(instruction);
  }

  private generateInstructionNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `PI-${yyyy}${mm}-${random}`;
  }

  private determineApprovalLevels(amount: number): number {
    if (amount > 1000000) return 3;
    if (amount > 100000) return 2;
    return 1;
  }

  async findById(id: string): Promise<PayInstruction | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(filters?: { status?: string; from?: Date; to?: Date }): Promise<PayInstruction[]> {
    const qb = this.repo.createQueryBuilder('instr');
    
    if (filters?.status) {
      qb.where('instr.approvalStatus = :status', { status: filters.status });
    }
    if (filters?.from) {
      qb.andWhere('instr.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('instr.createdAt <= :to', { to: filters.to });
    }
    
    return qb.orderBy('instr.createdAt', 'DESC').getMany();
  }

  async approve(id: string, dto: ApprovePaymentDto): Promise<void> {
    const instruction = await this.findById(id);
    if (!instruction) throw new NotFoundException(`Instruction ${id} not found`);

    const nextLevel = (instruction.currentApproverLevel ?? 1) + 1;
    const targetLevels = instruction.totalApprovalLevels || 1;

    await this.repo.update(id, {
      authorizedBy: dto.authorizedBy,
      authorizedAt: new Date(),
      currentApproverLevel: nextLevel,
      approvalStatus: nextLevel >= targetLevels ? 'approved' : 'approving',
      statusHistory: this.appendHistory(instruction.statusHistory, 'approved_level_' + nextLevel),
    });
  }

  async reject(id: string, reason: string): Promise<void> {
    await this.repo.update(id, {
      approvalStatus: 'rejected',
      statusHistory: this.appendHistory([], 'rejected'),
    });
  }

  async cancel(id: string): Promise<void> {
    const instruction = await this.findById(id);
    if (!instruction) throw new NotFoundException(`Instruction ${id} not found`);
    if (['executing', 'completed'].includes(instruction.approvalStatus)) {
      throw new Error('Cannot cancel instruction already in execution');
    }
    await this.repo.update(id, {
      approvalStatus: 'cancelled',
      statusHistory: this.appendHistory(instruction.statusHistory, 'cancelled'),
    });
  }

  async execute(id: string, dto: ExecutePaymentDto): Promise<void> {
    const instruction = await this.findById(id);
    if (!instruction) throw new NotFoundException(`Instruction ${id} not found`);
    if (instruction.approvalStatus !== 'approved') {
      throw new Error('Instruction must be approved before execution');
    }
    await this.repo.update(id, {
      approvalStatus: 'executing',
      bankingChannelReference: this.generateBankReference(),
      statusHistory: this.appendHistory(instruction.statusHistory, 'executing'),
    });
  }

  private appendHistory(currentHistory: any[], action: string): any {
    const history = currentHistory || [];
    history.push({ status: action, timestamp: new Date() });
    return history;
  }

  private generateBankReference(): string {
    return `BNK-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
}
