import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecoveryTicket } from '../entities/recovery-ticket.entity';
import { RecoveryStatus } from '../entities/recovery-status.enum';
import { RecoveryInitiateDto } from '../dto/recovery-initiate.dto';

@Injectable()
export class RecoveryService {
  constructor(
    @InjectRepository(RecoveryTicket)
    private readonly repo: Repository<RecoveryTicket>,
  ) {}

  async initiateRecovery(userId: string, dto: RecoveryInitiateDto): Promise<RecoveryTicket> {
    const ticket = this.repo.create({
      userId,
      contactMethod: dto.contactMethod,
      contactAddresses: JSON.parse(JSON.stringify(dto.contactAddresses)),
      requiredVerifications: 3,
      verifiedCount: 0,
      verificationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      cooldownUntil: null,
      status: RecoveryStatus.INITIATED,
      initiatedAt: new Date(),
    });
    return this.repo.save(ticket);
  }

  async confirmVerification(ticketId: string, confirmationCode: string): Promise<boolean> {
    // Placeholder: code validation logic here
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket || ticket.status !== RecoveryStatus.PENDING_VERIFICATION) return false;

    ticket.verifiedCount += 1;
    if (ticket.verifiedCount >= ticket.requiredVerifications) {
      ticket.status = RecoveryStatus.FINALIZED;
      ticket.cooldownUntil = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h safety delay
    }
    await this.repo.save(ticket);
    return true;
  }

  async getTicketStatus(ticketId: string): Promise<RecoveryTicket | null> {
    return this.repo.findOne({ where: { id: ticketId } });
  }

  async verifyCooldownExpired(userId: string): Promise<boolean> {
    const activeTicket = await this.repo.findOne({
      where: { userId, status: RecoveryStatus.FINALIZED },
      order: { finalizedAt: 'DESC' },
    });
    if (!activeTicket?.cooldownUntil) return true;
    return new Date() > activeTicket.cooldownUntil;
  }
}
