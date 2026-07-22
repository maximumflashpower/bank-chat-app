import { Test, TestingModule } from '@nestjs/testing';
import { P2pService } from './p2p.service';
import { Repository, In } from 'typeorm';
import { MobileP2pTransfer } from '../entities/mobile-p2p-transfer.entity';
import { P2pStatus, P2pTransferType } from '../enums/mobile.enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('P2pService', () => {
  let service: P2pService;
  let repo: Repository<MobileP2pTransfer>;

  const mockTransfer = {
    id: 'transfer-1',
    transferReference: 'P2P-20260721-00001',
    senderId: 'user-1',
    senderAccountId: 'account-1',
    recipientIdentifier: '+525555555555',
    recipientRegistered: false,
    recipientUserId: null,
    amount: 500,
    currency: 'USD',
    transferType: P2pTransferType.INVITE_PENDING,
    status: P2pStatus.PENDING,
    invitationLinkToken: 'INV-abc123',
    invitationExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        P2pService,
        {
          provide: getRepositoryToken(MobileP2pTransfer),
          useValue: {
            save: jest.fn((t) => Promise.resolve(t)),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<P2pService>(P2pService);
    repo = module.get<Repository<MobileP2pTransfer>>(getRepositoryToken(MobileP2pTransfer));
  });

  describe('sendP2P', () => {
    it('should send P2P to non-registered user (invite)', async () => {
      jest.spyOn(service as any, 'isRegisteredUser').mockResolvedValue(false);
      jest.spyOn(repo, 'save').mockImplementation((t) => Promise.resolve(t as any));

      const request = {
        senderId: 'user-1',
        senderAccountId: 'account-1',
        recipientIdentifier: '+525555555555',
        amount: 500,
        senderNote: 'Dinner split',
      };

      const result = await service.sendP2P(request);

      expect(result.transferType).toBe(P2pTransferType.INVITE_PENDING);
      expect(result.status).toBe(P2pStatus.PENDING);
      expect(result.invitationLinkToken).toBeDefined();
    });

    it('should send P2P instantly to registered user', async () => {
      jest.spyOn(service as any, 'isRegisteredUser').mockResolvedValue(true);
      jest.spyOn(repo, 'save').mockImplementation((t) => Promise.resolve(t as any));

      const request = {
        senderId: 'user-1',
        senderAccountId: 'account-1',
        recipientIdentifier: 'user-2',
        amount: 500,
      };

      const result = await service.sendP2P(request);

      expect(result.status).toBe(P2pStatus.CLAIMED);
      expect(result.recipientRegistered).toBe(true);
    });
  });

  describe('claimTransfer', () => {
    it('should claim pending transfer successfully', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer } as any);
      jest.spyOn(repo, 'save').mockImplementation((t) => Promise.resolve(t as any));

      const result = await service.claimTransfer('transfer-1', 'user-2');

      expect(result.status).toBe(P2pStatus.CLAIMED);
      expect(result.recipientUserId).toBe('user-2');
      expect(result.claimedAt).toBeDefined();
    });

    it('should throw BadRequestException if transfer already claimed', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer, status: P2pStatus.CLAIMED } as any);

      await expect(service.claimTransfer('transfer-1', 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invitation expired', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({
        ...mockTransfer,
        invitationExpiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(service.claimTransfer('transfer-1', 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if transfer not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.claimTransfer('transfer-999', 'user-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('returnTransfer', () => {
    it('should return pending transfer', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer } as any);
      jest.spyOn(repo, 'save').mockImplementation((t) => Promise.resolve(t as any));

      const result = await service.returnTransfer('transfer-1', 'user-1');

      expect(result.status).toBe(P2pStatus.RETURNED);
      expect(result.returnedAt).toBeDefined();
    });

    it('should throw BadRequestException if transfer not pending', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer, status: P2pStatus.CLAIMED } as any);

      await expect(service.returnTransfer('transfer-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if sender not authorized', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer, senderId: 'user-999' } as any);

      await expect(service.returnTransfer('transfer-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingTransfers', () => {
    it('should return pending transfers for sender', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([{ ...mockTransfer }] as any);

      const result = await service.getPendingTransfers('user-1');

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { senderId: 'user-1', status: In([P2pStatus.PENDING]) },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTransferById', () => {
    it('should return transfer if user is sender', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer } as any);

      const result = await service.getTransferById('transfer-1', 'user-1');

      expect(result.id).toBe('transfer-1');
    });

    it('should throw NotFoundException if user has no access', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer } as any);

      await expect(service.getTransferById('transfer-1', 'user-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteContact', () => {
    it('should mark SMS invitation as sent', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockTransfer } as any);
      jest.spyOn(repo, 'save').mockImplementation((t) => Promise.resolve(t as any));

      await service.inviteContact('transfer-1', '+525555555555');

      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transfer not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.inviteContact('transfer-999', '+525555555555')).rejects.toThrow(NotFoundException);
    });
  });
});
