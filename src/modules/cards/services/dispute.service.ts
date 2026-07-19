import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CardDispute, DisputeStatus, DisputeType } from '../entities/card-dispute.entity';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    @InjectRepository(CardDispute)
    private readonly repo: Repository<CardDispute>,
  ) {}

  async openDispute(data: {
    cardId: string;
    transactionId: string;
    disputeType: DisputeType;
    disputeAmount: number;
    description: string;
  }): Promise<CardDispute> {
    const disputeNumber = `DISP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

    const dispute = this.repo.create({
      ...data,
      disputeNumber,
      status: DisputeStatus.OPENED,
      evidenceDocuments: [],
      chargedBack: false,
      openedAt: new Date(),
    });

    const saved = await this.repo.save(dispute);
    this.logger.log(`Dispute opened: ${disputeNumber}, amount=${data.disputeAmount}`);
    return saved;
  }

  async findById(id: string): Promise<CardDispute> {
    const dispute = await this.repo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    return dispute;
  }

  async findByCard(cardId: string): Promise<CardDispute[]> {
    return this.repo.find({
      where: { cardId },
      order: { openedAt: 'DESC' },
    });
  }

  async addEvidence(id: string, documentUrl: string): Promise<CardDispute> {
    const dispute = await this.findById(id);
    dispute.evidenceDocuments.push(documentUrl);
    return this.repo.save(dispute);
  }

  async submitMerchantResponse(id: string, response: string): Promise<CardDispute> {
    const dispute = await this.findById(id);
    dispute.merchantResponse = response;
    return this.repo.save(dispute);
  }

  async resolve(id: string, result: 'won' | 'lost' | 'invalid', notes: string): Promise<CardDispute> {
    const dispute = await this.findById(id);

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute already resolved');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolutionNotes = notes;
    dispute.resolvedAt = new Date();

    if (result === 'won') {
      dispute.status = DisputeStatus.WON;
      dispute.chargedBack = true;
      dispute.chargebackAmount = Number(dispute.disputeAmount);
    } else if (result === 'lost') {
      dispute.status = DisputeStatus.LOST;
    } else {
      dispute.status = DisputeStatus.INVALID;
    }

    return this.repo.save(dispute);
  }

  async escalateToChargeback(id: string): Promise<CardDispute> {
    const dispute = await this.findById(id);
    dispute.status = DisputeStatus.UNDER_INVESTIGATION;
    dispute.chargedBack = true;
    dispute.chargebackAmount = Number(dispute.disputeAmount);
    return this.repo.save(dispute);
  }

  async getStatistics(days: number = 30): Promise<{
    totalOpen: number;
    totalResolved: number;
    wonCount: number;
    lostCount: number;
    totalAmount: number;
    byType: Record<string, number>;
  }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const disputes = await this.repo.find({
      where: { openedAt: MoreThan(cutoff) },
    });

    return {
      totalOpen: disputes.filter(d => d.status === DisputeStatus.OPENED || d.status === DisputeStatus.UNDER_INVESTIGATION).length,
      totalResolved: disputes.filter(d => d.status === DisputeStatus.RESOLVED || d.status === DisputeStatus.WON || d.status === DisputeStatus.LOST).length,
      wonCount: disputes.filter(d => d.status === DisputeStatus.WON).length,
      lostCount: disputes.filter(d => d.status === DisputeStatus.LOST).length,
      totalAmount: disputes.reduce((sum, d) => sum + Number(d.disputeAmount), 0),
      byType: disputes.reduce((acc, d) => {
        acc[d.disputeType] = (acc[d.disputeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
