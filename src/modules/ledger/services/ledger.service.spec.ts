import { LedgerService } from './ledger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountStatus } from '../entities/account-status.enum';

jest.mock('../entities/account.entity');
jest.mock('../entities/transaction.entity');

describe('LedgerService', () => {
  let service: LedgerService;
  let mockAccountRepo: any;
  let mockTxRepo: any;
  let mockNotificationService: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockAccountRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn() };
    mockTxRepo = { create: jest.fn(), find: jest.fn(), save: jest.fn() };
    mockNotificationService = { create: jest.fn() };
    mockDataSource = { transaction: jest.fn() };
    service = new LedgerService(mockAccountRepo, mockTxRepo, mockDataSource, mockNotificationService);
  });

  // ─── createAccount ──────────────────────────────────────────
  describe('createAccount', () => {
    it('should create account with generated number', async () => {
      const created = { id: 'acc-1', userId: 'user-1', balance: 0 };
      mockAccountRepo.create.mockReturnValue(created);
      mockAccountRepo.save.mockResolvedValue(created);

      const result = await service.createAccount('user-1', { type: 'CHECKING', currency: 'MXN' });

      expect(result.id).toBe('acc-1');
      expect(mockNotificationService.create).toHaveBeenCalled();
    });

    it('should default currency to MXN', async () => {
      const created = { id: 'acc-1', currency: 'MXN' };
      mockAccountRepo.create.mockReturnValue(created);
      mockAccountRepo.save.mockResolvedValue(created);

      const result = await service.createAccount('user-1', { type: 'SAVINGS' });

      expect(result.currency).toBe('MXN');
    });

    it('should send notification after creation', async () => {
      const created = { id: 'acc-1' };
      mockAccountRepo.create.mockReturnValue(created);
      mockAccountRepo.save.mockResolvedValue(created);

      await service.createAccount('user-1', { type: 'CHECKING' });

      expect(mockNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Cuenta creada',
        }),
      );
    });
  });

  // ─── getAccounts ────────────────────────────────────────────
  describe('getAccounts', () => {
    it('should return accounts for user', async () => {
      const accounts = [{ id: 'acc-1', userId: 'user-1' }];
      mockAccountRepo.find.mockResolvedValue(accounts);

      const result = await service.getAccounts('user-1');

      expect(result).toEqual(accounts);
      expect(mockAccountRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no accounts', async () => {
      mockAccountRepo.find.mockResolvedValue([]);
      const result = await service.getAccounts('user-none');
      expect(result).toEqual([]);
    });
  });

  // ─── getAccountById ─────────────────────────────────────────
  describe('getAccountById', () => {
    it('should return account when found and belongs to user', async () => {
      const account = { id: 'acc-1', userId: 'user-1' };
      mockAccountRepo.findOne.mockResolvedValue(account);

      const result = await service.getAccountById('user-1', 'acc-1');

      expect(result).toEqual(account);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockAccountRepo.findOne.mockResolvedValue(null);
      await expect(service.getAccountById('user-1', 'acc-missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if account belongs to another user', async () => {
      mockAccountRepo.findOne.mockResolvedValue({ id: 'acc-1', userId: 'user-2' });
      await expect(service.getAccountById('user-1', 'acc-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getBalance ─────────────────────────────────────────────
  describe('getBalance', () => {
    it('should return balance and currency', async () => {
      const account = { id: 'acc-1', userId: 'user-1', balance: 1000, currency: 'MXN' };
      mockAccountRepo.findOne.mockResolvedValue(account);

      const result = await service.getBalance('user-1', 'acc-1');

      expect(result.balance).toBe(1000);
      expect(result.currency).toBe('MXN');
    });

    it('should throw NotFoundException if account not found', async () => {
      mockAccountRepo.findOne.mockResolvedValue(null);
      await expect(service.getBalance('user-1', 'acc-missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deposit ────────────────────────────────────────────────
  describe('deposit', () => {
    const dto = { amount: 500, description: 'Test deposit' };

    it('should throw NotFoundException if account not found', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue(null) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.deposit('user-1', 'acc-missing', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if account belongs to another user', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'acc-1', userId: 'user-2', status: 'active' }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.deposit('user-1', 'acc-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account is not active', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'acc-1', userId: 'user-1', status: 'frozen' }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.deposit('user-1', 'acc-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should update balance and create transaction', async () => {
      const account = { id: 'acc-1', userId: 'user-1', status: 'active', balance: 1000, currency: 'MXN' };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(account),
        save: jest.fn().mockImplementation(obj => Promise.resolve(obj)),
        create: jest.fn().mockImplementation((cls, data) => data),
      };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      const result = await service.deposit('user-1', 'acc-1', dto);

      expect(result).toBeDefined();
      expect(account.balance).toBe(1500);
      expect(mockNotificationService.create).toHaveBeenCalled();
    });
  });

  // ─── transfer ───────────────────────────────────────────────
  describe('transfer', () => {
    const dto = { amount: 100, toAccountNumber: '00123456789012345678', description: 'Transfer' };

    it('should throw NotFoundException if source account not found', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue(null) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'acc-missing', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if source account belongs to another user', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'acc-1', userId: 'user-2', status: 'active', balance: 1000 }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'acc-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if source account is not active', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'acc-1', userId: 'user-1', status: 'frozen', balance: 1000 }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'acc-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'acc-1', userId: 'user-1', status: 'active', balance: 50 }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'acc-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if destination account not found', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValueOnce({ id: 'from-acc', userId: 'user-1', status: 'active', balance: 1000 }).mockResolvedValueOnce(null) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'from-acc', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if transferring to same account', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue({ id: 'same-acc', userId: 'user-1', status: 'active', balance: 1000 }) };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await expect(service.transfer('user-1', 'same-acc', { ...dto, toAccountNumber: 'same-number' })).rejects.toThrow(BadRequestException);
    });

    it('should complete transfer and notify both parties', async () => {
      const fromAccount = { id: 'from-acc', userId: 'user-1', accountNumber: '00111111111111111111', status: 'active', balance: 1000, currency: 'MXN' };
      const toAccount = { id: 'to-acc', userId: 'user-2', accountNumber: '00123456789012345678', status: 'active', balance: 0, currency: 'MXN' };
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(fromAccount).mockResolvedValueOnce(toAccount),
        save: jest.fn().mockImplementation(obj => Promise.resolve(obj)),
        create: jest.fn().mockImplementation((cls, data) => data),
      };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      const result = await service.transfer('user-1', 'from-acc', dto);

      expect(result).toHaveLength(2);
      expect(mockNotificationService.create).toHaveBeenCalledTimes(2);
    });

    it('should only notify sender when transferring to own account', async () => {
      const fromAccount = { id: 'from-acc', userId: 'user-1', accountNumber: '00111111111111111111', status: 'active', balance: 1000, currency: 'MXN' };
      const toAccount = { id: 'to-acc', userId: 'user-1', accountNumber: '00123456789012345678', status: 'active', balance: 0, currency: 'MXN' };
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(fromAccount).mockResolvedValueOnce(toAccount),
        save: jest.fn().mockImplementation(obj => Promise.resolve(obj)),
        create: jest.fn().mockImplementation((cls, data) => data),
      };
      mockDataSource.transaction.mockImplementation(fn => fn(mockManager));

      await service.transfer('user-1', 'from-acc', dto);

      expect(mockNotificationService.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getTransactions ────────────────────────────────────────
  describe('getTransactions', () => {
    it('should return transactions for account', async () => {
      const account = { id: 'acc-1', userId: 'user-1' };
      const transactions = [{ id: 'tx-1' }];
      mockAccountRepo.findOne.mockResolvedValue(account);
      mockTxRepo.find.mockResolvedValue(transactions);

      const result = await service.getTransactions('user-1', 'acc-1');

      expect(result).toEqual(transactions);
      expect(mockTxRepo.find).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });
});
