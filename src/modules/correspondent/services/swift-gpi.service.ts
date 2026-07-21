import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RemittanceInstruction } from '../entities/remittance-instruction.entity';

@Injectable()
export class SwiftGpiService {
  constructor(
    @InjectRepository(RemittanceInstruction)
    private repo: Repository<RemittanceInstruction>,
  ) {}

  async createGpiTracker(referenceId: string): Promise<string> {
    const uetr = this.generateUETR();
    const instruction = await this.repo.findOne({ where: { id: referenceId } });
    if (!instruction) throw new NotFoundException(`Instruction ${referenceId} not found`);

    instruction.gpiTrackingId = uetr;
    await this.repo.save(instruction);

    return uetr;
  }

  private generateUETR(): string {
    return `${this.randomHex(8)}-${this.randomHex(4)}-${this.randomHex(4)}-${this.randomHex(4)}-${this.randomHex(12)}`;
  }

  private randomHex(length: number): string {
    const chars = '0123456789abcdef';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async getGpiStatus(trackingId: string): Promise<{
    trackingId: string;
    status: string;
    senderBic: string | null;
    receiverBic: string | null;
    intermediariesBic: string[];
    amountSent: number;
    currency: string;
    amountReceived: number | null;
    chargesDeducted: number | null;
    sentTimestamp: Date | null;
    receivedTimestamp: Date | null;
    lastUpdated: Date;
  }> {
    const instruction = await this.repo.findOne({ where: { gpiTrackingId: trackingId } });
    if (!instruction) throw new NotFoundException(`GPI tracker ${trackingId} not found`);

    return {
      trackingId,
      status: instruction.status,
      senderBic: instruction.correspondentBankId || null,
      receiverBic: instruction.beneficiaryBankBic || null,
      intermediariesBic: [],
      amountSent: Number(instruction.amountOriginal),
      currency: instruction.currencyOriginal,
      amountReceived: instruction.fxAmountSettled ? Number(instruction.fxAmountSettled) : null,
      chargesDeducted: instruction.totalFeesAmount ? Number(instruction.totalFeesAmount) : null,
      sentTimestamp: instruction.executedAt,
      receivedTimestamp: instruction.beneficiaryCreditedAt,
      lastUpdated: instruction.updatedAt,
    };
  }

  async updateGpiStatus(trackingId: string, status: string, notes?: string): Promise<void> {
    const instruction = await this.repo.findOne({ where: { gpiTrackingId: trackingId } });
    if (!instruction) throw new NotFoundException(`GPI tracker ${trackingId} not found`);

    instruction.status = status;
    if (notes && instruction.remitterNotes) {
      instruction.remitterNotes = `${instruction.remitterNotes}\n${notes}`;
    } else if (notes) {
      instruction.remitterNotes = notes;
    }

    await this.repo.save(instruction);
  }

  async sendSwiftMessageMT103(instructionId: string): Promise<{
    messageId: string;
    swiftContent: string;
    sentAt: Date;
  }> {
    const instruction = await this.repo.findOne({ where: { id: instructionId } });
    if (!instruction) throw new NotFoundException(`Instruction ${instructionId} not found`);

    const messageId = `MT103-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const swiftContent = this.constructMT103(instruction);

    return {
      messageId,
      swiftContent,
      sentAt: new Date(),
    };
  }

  private constructMT103(instruction: RemittanceInstruction): string {
    const dateStr = instruction.executedAt
      ? this.formatDate(instruction.executedAt)
      : this.formatDate(new Date());
    return `
{1:F01SENDERBICXXXXXXXX}{2:I103RECEIVERBICXXXXN}
{4:
:20:${instruction.remittanceNumber}
:23B:BANK
:32A:${dateStr}${instruction.currencyOriginal}${Number(instruction.amountOriginal).toFixed(2)}
:50A:${instruction.originatingCustomerId}
:59:${instruction.beneficiaryName}/${instruction.beneficiaryAccountNumber}
:71A:OUR
:71F:${Number(instruction.totalFeesAmount || 0)}
:72:/INS/NARRATIVE
}
`;
  }

  private formatDate(date: Date | null): string {
    if (!date) return '260720';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy.toString().slice(-2)}${mm}${dd}`;
  }

  async receiveSwiftMessageMT103(content: string): Promise<{
    trackingId: string;
    amountReceived: number;
    creditedTimestamp: Date;
  }> {
    const extractedData = this.parseMT103(content);

    const instruction = await this.repo.findOne({
      where: { remittanceNumber: extractedData.reference },
    });
    if (!instruction) throw new NotFoundException('Matching instruction not found');

    instruction.fxAmountSettled = extractedData.amount;
    instruction.status = 'completed';
    instruction.beneficiaryCreditedAt = new Date();

    await this.repo.save(instruction);

    return {
      trackingId: instruction.gpiTrackingId || '',
      amountReceived: Number(extractedData.amount),
      creditedTimestamp: new Date(),
    };
  }

  private parseMT103(content: string): { reference: string; amount: number; currency: string } {
    const referenceMatch = content.match(/:20:([^\n]+)/);
    const amountMatch = content.match(/:32A:\d{6}([A-Z]{3})(\d+\.\d+)/);

    return {
      reference: referenceMatch ? referenceMatch[1].trim() : '',
      currency: amountMatch ? amountMatch[1] : 'USD',
      amount: amountMatch ? parseFloat(amountMatch[2]) : 0,
    };
  }

  async getGpiAnalytics(startDate: Date, endDate: Date): Promise<{
    totalTransactions: number;
    totalAmount: number;
    averageTimeToCredit: number;
    successRate: number;
    byCorridor: Array<{ corridor: string; count: number; avgTime: number }>;
  }> {
    const instructions = await this.repo.find({
      where: {
        executedAt: Between(startDate, endDate) as any,
      },
    });

    const completed = instructions.filter(i => i.status === 'completed');
    const successRate = instructions.length > 0 ? (completed.length / instructions.length) * 100 : 0;

    const totalAmount = instructions.reduce((sum, i) => sum + Number(i.amountOriginal), 0);

    const avgTime = completed.length > 0
      ? completed.reduce((sum, i) => {
          const timeDiff = i.beneficiaryCreditedAt?.getTime() && i.executedAt?.getTime()
            ? (i.beneficiaryCreditedAt.getTime() - i.executedAt.getTime()) / (1000 * 60 * 60)
            : 0;
          return sum + timeDiff;
        }, 0) / completed.length
      : 0;

    return {
      totalTransactions: instructions.length,
      totalAmount,
      averageTimeToCredit: avgTime,
      successRate,
      byCorridor: [],
    };
  }
}
