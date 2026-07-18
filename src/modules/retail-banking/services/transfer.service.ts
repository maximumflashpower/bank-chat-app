import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetailTransferInstruction, TransferType, TransferStatus, TransferFrequency, RecurringFrequency } from '../entities/retail-transfer-instruction.entity';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(RetailTransferInstruction)
    private readonly repo: Repository<RetailTransferInstruction>,
  ) {}

  async createTransfer(data: Partial<RetailTransferInstruction>): Promise<RetailTransferInstruction> {
    const instructionNumber = data.instructionNumber || this.generateInstructionNumber();
    const transfer = this.repo.create({
      ...data,
      instructionNumber,
      status: TransferStatus.PENDING,
      frequency: data.frequency || TransferFrequency.ONE_TIME,
      executionCount: 0,
    });
    const saved = await this.repo.save(transfer);
    this.logger.log(`Transfer created: ${instructionNumber}, type=${saved.transferType}, amount=${saved.amount}`);
    return saved;
  }

  async findById(id: string): Promise<RetailTransferInstruction> {
    const transfer = await this.repo.findOne({ where: { id } });
    if (!transfer) throw new NotFoundException(`Transfer ${id} not found`);
    return transfer;
  }

  async findBySourceAccount(accountId: string): Promise<RetailTransferInstruction[]> {
    return this.repo.find({ where: { sourceAccountId: accountId }, order: { createdAt: 'DESC' } });
  }

  async findByInitiator(userId: string): Promise<RetailTransferInstruction[]> {
    return this.repo.find({ where: { initiatedBy: userId }, order: { createdAt: 'DESC' } });
  }

  async executeTransfer(id: string): Promise<RetailTransferInstruction> {
    const transfer = await this.findById(id);
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer ${id} is not pending`);
    }
    transfer.status = TransferStatus.EXECUTING;
    await this.repo.save(transfer);

    try {
      transfer.status = TransferStatus.COMPLETED;
      transfer.executionCount = transfer.executionCount + 1;

      if (transfer.frequency === TransferFrequency.RECURRING) {
        transfer.nextExecutionDate = this.calculateNextExecution(transfer);
      }
      await this.repo.save(transfer);
      this.logger.log(`Transfer ${transfer.instructionNumber} completed`);
      return transfer;
    } catch (error) {
      transfer.status = TransferStatus.FAILED;
      transfer.failureReason = error instanceof Error ? error.message : 'Unknown error';
      await this.repo.save(transfer);
      this.logger.error(`Transfer ${transfer.instructionNumber} failed: ${transfer.failureReason}`);
      return transfer;
    }
  }

  async cancelTransfer(id: string): Promise<RetailTransferInstruction> {
    const transfer = await this.findById(id);
    if (transfer.status === TransferStatus.COMPLETED) {
      throw new BadRequestException(`Cannot cancel completed transfer`);
    }
    transfer.status = TransferStatus.CANCELLED;
    await this.repo.save(transfer);
    this.logger.log(`Transfer ${transfer.instructionNumber} cancelled`);
    return transfer;
  }

  async modifyTransfer(id: string, data: Partial<RetailTransferInstruction>): Promise<RetailTransferInstruction> {
    const transfer = await this.findById(id);
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Can only modify pending transfers`);
    }
    Object.assign(transfer, data);
    return this.repo.save(transfer);
  }

  async listRecurring(userId: string): Promise<RetailTransferInstruction[]> {
    return this.repo.find({
      where: { initiatedBy: userId, frequency: TransferFrequency.RECURRING, status: TransferStatus.COMPLETED },
      order: { nextExecutionDate: 'ASC' },
    });
  }

  async cancelRecurring(id: string): Promise<RetailTransferInstruction> {
    const transfer = await this.findById(id);
    if (transfer.frequency !== TransferFrequency.RECURRING) {
      throw new BadRequestException(`Transfer ${id} is not recurring`);
    }
    transfer.status = TransferStatus.CANCELLED;
    transfer.recurringEndDate = new Date();
    await this.repo.save(transfer);
    this.logger.log(`Recurring transfer ${transfer.instructionNumber} cancelled`);
    return transfer;
  }

  async processDueRecurring(): Promise<{ processed: number; failed: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = await this.repo.find({
      where: { frequency: TransferFrequency.RECURRING, status: TransferStatus.COMPLETED },
    });
    let processed = 0;
    let failed = 0;
    for (const transfer of due) {
      if (transfer.nextExecutionDate && transfer.nextExecutionDate <= today) {
        if (transfer.recurringEndDate && transfer.recurringEndDate < today) {
          continue;
        }
        try {
          await this.executeTransfer(transfer.id);
          processed++;
        } catch {
          failed++;
        }
      }
    }
    this.logger.log(`Recurring batch: processed=${processed}, failed=${failed}`);
    return { processed, failed };
  }

  private calculateNextExecution(transfer: RetailTransferInstruction): Date | null {
    if (!transfer.recurringFrequency) return null;
    const next = new Date(transfer.nextExecutionDate || new Date());
    switch (transfer.recurringFrequency) {
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  private generateInstructionNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `TRF-${date}-${seq}`;
  }
}
