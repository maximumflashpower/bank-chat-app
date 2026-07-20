import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MobileP2pTransfer } from '../entities/mobile-p2p-transfer.entity';
import { P2pStatus, P2pTransferType } from '../enums/mobile.enums';

interface P2PSendRequest {
  senderId: string;
  senderAccountId: string;
  recipientIdentifier: string;
  amount: number;
  senderNote?: string;
}

@Injectable()
export class P2pService {
  private readonly DAILY_P2P_LIMIT = 10000;
  private readonly INVITE_EXPIRY_HOURS = 72;

  constructor(
    @InjectRepository(MobileP2pTransfer)
    private readonly repo: Repository<MobileP2pTransfer>,
  ) {}

  async sendP2P(request: P2PSendRequest): Promise<MobileP2pTransfer> {
    const isInternalRecipient = await this.isRegisteredUser(request.recipientIdentifier);
    
    const transferType = isInternalRecipient 
      ? P2pTransferType.INSTANT_INTERNAL 
      : P2pTransferType.INVITE_PENDING;

    const transferReference = `P2P-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
    const invitationToken = `INV-${Math.random().toString(36).substring(2, 15)}`;

    const transfer = new MobileP2pTransfer();
    transfer.transferReference = transferReference;
    transfer.senderId = request.senderId;
    transfer.senderAccountId = request.senderAccountId;
    transfer.recipientIdentifier = request.recipientIdentifier;
    transfer.recipientRegistered = isInternalRecipient;
    transfer.amount = request.amount;
    transfer.currency = 'USD';
    transfer.senderNote = request.senderNote ?? '';
    transfer.transferType = transferType;
    transfer.status = isInternalRecipient ? P2pStatus.CLAIMED : P2pStatus.PENDING;

    if (!isInternalRecipient) {
      transfer.invitationLinkToken = invitationToken;
      transfer.invitationExpiresAt = new Date(Date.now() + this.INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
    }

    return this.repo.save(transfer);
  }

  async claimTransfer(transferId: string, recipientUserId: string): Promise<MobileP2pTransfer> {
    const transfer = await this.repo.findOne({ where: { id: transferId } });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== P2pStatus.PENDING) {
      throw new BadRequestException('Transfer cannot be claimed');
    }

    if (transfer.invitationExpiresAt && transfer.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Transfer invitation expired');
    }

    transfer.status = P2pStatus.CLAIMED;
    transfer.claimedAt = new Date();
    transfer.recipientUserId = recipientUserId;
    transfer.recipientRegistered = true;

    return this.repo.save(transfer);
  }

  async returnTransfer(transferId: string, senderId: string): Promise<MobileP2pTransfer> {
    const transfer = await this.repo.findOne({ where: { id: transferId } });

    if (!transfer || transfer.senderId !== senderId) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== P2pStatus.PENDING) {
      throw new BadRequestException('Only pending transfers can be returned');
    }

    transfer.status = P2pStatus.RETURNED;
    transfer.returnedAt = new Date();

    return this.repo.save(transfer);
  }

  async getPendingTransfers(senderId: string): Promise<MobileP2pTransfer[]> {
    return this.repo.find({
      where: { senderId, status: In([P2pStatus.PENDING]) },
      order: { createdAt: 'DESC' },
    });
  }

  async getTransferById(transferId: string, userId: string): Promise<MobileP2pTransfer> {
    const transfer = await this.repo.findOne({
      where: { id: transferId },
    });

    if (!transfer || (transfer.senderId !== userId && transfer.recipientUserId !== userId)) {
      throw new NotFoundException('Transfer not found or access denied');
    }

    return transfer;
  }

  async inviteContact(transferId: string, phoneNumber: string): Promise<void> {
    const transfer = await this.repo.findOne({ where: { id: transferId } });
    if (!transfer) throw new NotFoundException('Transfer not found');

    transfer.invitationSmsSent = true;
    await this.repo.save(transfer);
  }

  private async isRegisteredUser(identifier: string): Promise<boolean> {
    return false;
  }
}
