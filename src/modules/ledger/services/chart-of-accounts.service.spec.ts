import { ChartOfAccountsService } from './chart-of-accounts.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../entities/ledger_chart_of_accounts.entity');

describe('ChartOfAccountsService', () => {
  let service: ChartOfAccountsService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };
    service = new ChartOfAccountsService(mockRepo);
  });

  // ─── create ──────────────────────────────────────────────────
  describe('create', () => {
    it('should throw BadRequestException if account code already exists', async () => {
      const existing = { id: 'coa-1', account_code: 'ACC001' };
      mockRepo.findOne.mockResolvedValue(existing);

      await expect(
        service.create({
          account_code: 'ACC001',
          account_name: 'Test Account',
          account_type: 'ASSET',
          normal_balance: 'DEBIT',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if parent account not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          account_code: 'ACC002',
          account_name: 'Child Account',
          account_type: 'ASSET',
          normal_balance: 'DEBIT',
          parent_account_id: 'parent-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create account successfully with all fields', async () => {
      mockRepo.findOne.mockResolvedValue(null); // no existing
      const created = { id: 'coa-1', account_code: 'ACC003', level: 1, is_postable: true };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({
        account_code: 'ACC003',
        account_name: 'Cash Account',
        account_type: 'ASSET',
        normal_balance: 'DEBIT',
        level: 2,
        currency: 'EUR',
      });

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        account_code: 'ACC003',
        level: 2,
        currency: 'EUR',
      }));
    });

    it('should set default values for optional fields', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created = { id: 'coa-2', is_postable: true, is_control_account: false };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.create({
        account_code: 'ACC004',
        account_name: 'Default Account',
        account_type: 'LIABILITY',
        normal_balance: 'CREDIT',
      });

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.is_postable).toBe(true);
      expect(createCall.is_control_account).toBe(false);
      expect(createCall.level).toBe(1);
      expect(createCall.currency).toBe('USD');
    });

    it('should accept parent_account_id when parent exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null); // no existing
      mockRepo.findOne.mockResolvedValueOnce({ id: 'parent-1' }); // parent found
      const created = { id: 'coa-3', parent_account_id: 'parent-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create({
        account_code: 'ACC005',
        account_name: 'Sub Account',
        account_type: 'ASSET',
        normal_balance: 'DEBIT',
        parent_account_id: 'parent-1',
      });

      expect(result.parent_account_id).toBe('parent-1');
    });
  });

  // ─── findAll ─────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all accounts ordered by account_code ASC', async () => {
      const accounts = [
        { id: 'coa-1', account_code: 'ACC001', account_name: 'Asset 1' },
        { id: 'coa-2', account_code: 'ACC002', account_name: 'Liability 1' },
      ];
      mockRepo.find.mockResolvedValue(accounts);

      const result = await service.findAll();

      expect(result).toEqual(accounts);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { account_code: 'ASC' } });
    });

    it('should return empty array when no accounts exist', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────
  describe('findById', () => {
    it('should return account when found', async () => {
      const account = { id: 'coa-1', account_code: 'ACC001' };
      mockRepo.findOne.mockResolvedValue(account);

      const result = await service.findById('coa-1');

      expect(result).toEqual(account);
    });

    it('should throw NotFoundException when account not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByCode ──────────────────────────────────────────────
  describe('findByCode', () => {
    it('should return account when found by code', async () => {
      const account = { id: 'coa-2', account_code: 'ACC002' };
      mockRepo.findOne.mockResolvedValue(account);

      const result = await service.findByCode('ACC002');

      expect(result).toEqual(account);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { account_code: 'ACC002' } });
    });

    it('should throw NotFoundException when account not found by code', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findByCode('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ──────────────────────────────────────────────────
  describe('update', () => {
    it('should throw BadRequestException when updating to existing account code', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-1' }); // findById returns account
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-2', account_code: 'ACC001' }); // existing found

      await expect(
        service.update('coa-1', { account_code: 'ACC001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow update to same account code', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-1', account_code: 'ACC001' });
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-1', account_code: 'ACC001' });
      const updated = { id: 'coa-1', account_code: 'ACC001', account_name: 'Updated Name' };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update('coa-1', { account_code: 'ACC001', account_name: 'Updated Name' });

      expect(result).toEqual(updated);
    });

    it('should update and save account successfully', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-1', account_code: 'ACC001' });
      mockRepo.findOne.mockResolvedValueOnce(null); // no existing different code
      const updated = { id: 'coa-1', account_code: 'ACC002', account_name: 'New Name' };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update('coa-1', { account_code: 'ACC002', account_name: 'New Name' });

      expect(result).toEqual(updated);
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        account_code: 'ACC002',
        account_name: 'New Name',
      }));
    });

    it('should handle partial updates', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'coa-1' });
      mockRepo.findOne.mockResolvedValueOnce(null);
      const updated = { id: 'coa-1', account_code: 'ACC001', currency: 'EUR' };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update('coa-1', { currency: 'EUR' });

      expect(result.currency).toBe('EUR');
    });
  });

  // ─── getHierarchy ────────────────────────────────────────────
  describe('getHierarchy', () => {
    it('should return accounts ordered by level and account_code', async () => {
      const accounts = [
        { id: 'coa-1', level: 1, account_code: 'ACC001' },
        { id: 'coa-2', level: 2, account_code: 'ACC002' },
      ];
      mockRepo.createQueryBuilder().getMany.mockResolvedValue(accounts);

      const result = await service.getHierarchy();

      expect(result).toEqual(accounts);
      expect(mockRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('coa.level', 'ASC');
      expect(mockRepo.createQueryBuilder().addOrderBy).toHaveBeenCalledWith('coa.account_code', 'ASC');
    });

    it('should return empty array when no accounts exist', async () => {
      mockRepo.createQueryBuilder().getMany.mockResolvedValue([]);
      const result = await service.getHierarchy();
      expect(result).toEqual([]);
    });
  });

  // ─── getBalancesForAccount ───────────────────────────────────
  describe('getBalancesForAccount', () => {
    it('should return stubbed balances of 0 for debit and credit', async () => {
      const result = await service.getBalancesForAccount('account-1');

      expect(result).toEqual({ debit: 0, credit: 0 });
    });

    it('should ignore accountId in stub implementation', async () => {
      const result1 = await service.getBalancesForAccount('acc-1');
      const result2 = await service.getBalancesForAccount('acc-2');

      expect(result1).toEqual({ debit: 0, credit: 0 });
      expect(result2).toEqual({ debit: 0, credit: 0 });
    });
  });
});
