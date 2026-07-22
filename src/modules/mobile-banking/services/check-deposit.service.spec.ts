import { Test, TestingModule } from '@nestjs/testing';
import { CheckDepositService } from './check-deposit.service';
import { Repository, MoreThan, Not, In } from 'typeorm';
import { MobileCheckDeposit } from '../entities/mobile-check-deposit.entity';
import { DepositStatus } from '../enums/mobile.enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CheckDepositService', () => {
  let service: CheckDepositService;
  let repo: Repository<MobileCheckDeposit>;

  const mockDeposit = {
    id: 'deposit-1',
    depositReference: 'MCD-20260721-00001',
    customerId: 'customer-1',
    accountId: 'account-1',
    checkAmount: 1500,
    frontImageUrl: 'https://example.com/front.jpg',
    backImageUrl: 'https://example.com/back.jpg',
    customerConfirmedAmount: true,
    depositStatus: DepositStatus.SUBMITTED,
    submittedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckDepositService,
        {
          provide: getRepositoryToken(MobileCheckDeposit),
          useValue: {
            save: jest.fn((deposit) => Promise.resolve(deposit)),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckDepositService>(CheckDepositService);
    repo = module.get<Repository<MobileCheckDeposit>>(getRepositoryToken(MobileCheckDeposit));
  });

  describe('submitDeposit', () => {
    it('should submit deposit successfully under limit', async () => {
      jest.spyOn(repo, 'count').mockResolvedValue(0);
      jest.spyOn(repo, 'save').mockImplementation((dep) => Promise.resolve(dep));

      const request = {
        customerId: 'customer-1',
        accountId: 'account-1',
        amount: 1500,
        frontImageUrl: 'https://example.com/front.jpg',
        backImageUrl: 'https://example.com/back.jpg',
        customerConfirmedAmount: true,
      };

      const result = await service.submitDeposit(request);

      expect(result.checkAmount).toBe(1500);
      expect(result.depositStatus).toBe(DepositStatus.SUBMITTED);
      expect(result.depositReference).toMatch(/^MCD-\d{8}-\d{5}$/);
    });

    it('should throw BadRequestException when daily limit reached', async () => {
      jest.spyOn(repo, 'count').mockResolvedValue(3);

      const request = {
        customerId: 'customer-1',
        accountId: 'account-1',
        amount: 1500,
        frontImageUrl: 'https://example.com/front.jpg',
        backImageUrl: 'https://example.com/back.jpg',
        customerConfirmedAmount: true,
      };

      await expect(service.submitDeposit(request)).rejects.toThrow(BadRequestException);
    });

    it('should handle conditional fields correctly', async () => {
      jest.spyOn(repo, 'count').mockResolvedValue(0);
      jest.spyOn(repo, 'save').mockImplementation((dep) => Promise.resolve(dep));

      const request = {
        customerId: 'customer-1',
        accountId: 'account-1',
        amount: 1500,
        checkNumber: '1234',
        checkDate: new Date('2026-07-20'),
        payerName: 'John Doe',
        frontImageUrl: 'https://example.com/front.jpg',
        backImageUrl: 'https://example.com/back.jpg',
        customerConfirmedAmount: true,
      };

      const result = await service.submitDeposit(request);

      expect(result).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('should return deposit status by ID and customer', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockDeposit as any);

      const result = await service.getStatus('deposit-1', 'customer-1');

      expect(result.id).toBe('deposit-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'deposit-1', customerId: 'customer-1' },
      });
    });

    it('should throw NotFoundException if deposit not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.getStatus('deposit-999', 'customer-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDepositHistory', () => {
    it('should return deposit history for customer', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockDeposit as any]);

      const result = await service.getDepositHistory('customer-1');

      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
        order: { submittedAt: 'DESC' },
      });
    });
  });

  describe('processDepositApproval', () => {
    it('should approve deposit and set hold date', async () => {
      const approvedDeposit = {
        ...mockDeposit,
        depositStatus: DepositStatus.ACCEPTED,
        holdUntilDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockDeposit as any);
      jest.spyOn(repo, 'save').mockImplementation((dep) => Promise.resolve(dep as any));

      const result = await service.processDepositApproval('deposit-1', true);

      expect(result.depositStatus).toBe(DepositStatus.ACCEPTED);
      expect(result.holdUntilDate).toBeDefined();
    });

    it('should reject deposit with reason', async () => {
      const rejectedDeposit = {
        ...mockDeposit,
        depositStatus: DepositStatus.REJECTED,
        rejectionReason: 'Image unclear',
      };
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockDeposit as any);
      jest.spyOn(repo, 'save').mockImplementation((dep) => Promise.resolve(dep as any));

      const result = await service.processDepositApproval('deposit-1', false, 'Image unclear');

      expect(result.depositStatus).toBe(DepositStatus.REJECTED);
      expect(result.rejectionReason).toBe('Image unclear');
    });

    it('should throw NotFoundException if deposit not found for approval', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.processDepositApproval('deposit-999', true)).rejects.toThrow(NotFoundException);
    });
  });
});
