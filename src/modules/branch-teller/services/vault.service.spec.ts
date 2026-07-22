import { VaultService } from './vault.service';
import { VaultMovementType, VaultMovementStatus } from '../entities/teller-vault-movement.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VaultService', () => {
  let service: VaultService;
  let vaultRepo: any;
  let movementRepo: any;

  beforeEach(() => {
    vaultRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    movementRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new VaultService(vaultRepo, movementRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════
  describe('findAll', () => {
    it('should return all active vaults', async () => {
      const mockVaults = [{ id: 'v1' }, { id: 'v2' }];
      vaultRepo.find.mockResolvedValue(mockVaults);
      const result = await service.findAll();
      expect(result).toBe(mockVaults);
      expect(vaultRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { vaultIdentifier: 'ASC' },
      });
    });

    it('should return empty array when no vaults', async () => {
      vaultRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════
  describe('getById', () => {
    it('should return vault by id', async () => {
      const mockVault = { id: 'v1', vaultIdentifier: 'VAULT-01' };
      vaultRepo.findOne.mockResolvedValue(mockVault);
      const result = await service.getById('v1');
      expect(result).toBe(mockVault);
    });

    it('should throw NotFoundException when vault not found', async () => {
      vaultRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // createVault
  // ═══════════════════════════════════════════════════
  describe('createVault', () => {
    const createData = {
      branchId: 'b1',
      vaultIdentifier: 'VAULT-01',
      vaultGrade: 'CLASS_A',
      primaryCustodianId: 'u1',
      dualControlRequired: true,
      initialBalance: 100000,
    };

    it('should create a new vault and register initial movement', async () => {
      vaultRepo.findOne.mockResolvedValue(null);
      vaultRepo.create.mockReturnValue({ id: 'v1', ...createData });
      vaultRepo.save.mockResolvedValue({ id: 'v1', ...createData });
      movementRepo.create.mockReturnValue({});
      movementRepo.save.mockResolvedValue({});

      const result = await service.createVault(createData);
      expect(result.id).toBe('v1');
      expect(vaultRepo.findOne).toHaveBeenCalledWith({
        where: { branchId: 'b1', vaultIdentifier: 'VAULT-01' },
      });
      expect(movementRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when vault already exists', async () => {
      vaultRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.createVault(createData)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // executeMovement
  // ═══════════════════════════════════════════════════
  describe('executeMovement', () => {
    const mockVault = {
      id: 'v1',
      currentBalanceTotal: 50000,
      dualControlRequired: false,
    };
    const baseDto = {
      vaultId: 'v1',
      movementType: VaultMovementType.CASH_IN,
      amountTotal: 5000,
      requestedByUserId: 'u1',
    };

    it('should execute CASH_IN movement and update balance', async () => {
      vaultRepo.findOne.mockResolvedValue(mockVault);
      movementRepo.create.mockReturnValue({});
      movementRepo.save.mockResolvedValue({ id: 'm1', movementStatus: VaultMovementStatus.PENDING });
      vaultRepo.create.mockReturnValue({ ...mockVault });
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.executeMovement(baseDto);
      expect(result.movementStatus).toBe(VaultMovementStatus.PENDING);
      expect(movementRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for CASH_OUT with insufficient balance', async () => {
      vaultRepo.findOne.mockResolvedValue({ ...mockVault, currentBalanceTotal: 1000 });
      await expect(
        service.executeMovement({ ...baseDto, movementType: VaultMovementType.CASH_OUT, amountTotal: 5000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for TRANSFER_OUT with insufficient balance', async () => {
      vaultRepo.findOne.mockResolvedValue({ ...mockVault, currentBalanceTotal: 1000 });
      await expect(
        service.executeMovement({ ...baseDto, movementType: VaultMovementType.TRANSFER_OUT, amountTotal: 5000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when dualControlRequired and no requestedByUserId', async () => {
      vaultRepo.findOne.mockResolvedValue({ ...mockVault, dualControlRequired: true });
      await expect(
        service.executeMovement({ ...baseDto, requestedByUserId: '' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow CASH_OUT when balance is sufficient', async () => {
      vaultRepo.findOne.mockResolvedValue(mockVault);
      movementRepo.create.mockReturnValue({});
      movementRepo.save.mockResolvedValue({ id: 'm1' });
      vaultRepo.save.mockResolvedValue(mockVault);

      const result = await service.executeMovement({
        ...baseDto,
        movementType: VaultMovementType.CASH_OUT,
        amountTotal: 5000,
      });
      expect(result).toBeDefined();
    });

    it('should pass denominationBreakdown when provided', async () => {
      vaultRepo.findOne.mockResolvedValue(mockVault);
      movementRepo.create.mockReturnValue({});
      movementRepo.save.mockResolvedValue({ id: 'm1' });
      vaultRepo.save.mockResolvedValue(mockVault);

      await service.executeMovement({
        ...baseDto,
        denominationBreakdown: { '100': 50, '50': 20 },
      } as any);
      const createdArg = movementRepo.create.mock.calls[0][0];
      expect(createdArg.denominationBreakdown).toBeDefined();
    });

    it('should default currencyCode to USD when not provided', async () => {
      vaultRepo.findOne.mockResolvedValue(mockVault);
      movementRepo.create.mockReturnValue({});
      movementRepo.save.mockResolvedValue({ id: 'm1' });
      vaultRepo.save.mockResolvedValue(mockVault);

      await service.executeMovement(baseDto);
      expect(movementRepo.create.mock.calls[0][0].currencyCode).toBe('USD');
    });

    it('should throw NotFoundException when vault does not exist', async () => {
      vaultRepo.findOne.mockResolvedValue(null);
      await expect(service.executeMovement(baseDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // confirmMovement
  // ═══════════════════════════════════════════════════
  describe('confirmMovement', () => {
    it('should confirm a pending movement with dual control', async () => {
      const movement = { id: 'm1', movementStatus: VaultMovementStatus.PENDING };
      movementRepo.findOne.mockResolvedValue(movement);
      movementRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmMovement('m1', 'supervisor-1', 'witness-1');
      expect(result.movementStatus).toBe(VaultMovementStatus.COMPLETED);
      expect(result.authorizedByUserId).toBe('supervisor-1');
      expect(result.dualControlApproved).toBe(true);
      expect(result.dualControlWitnessId).toBe('witness-1');
      expect(result.executedAt).toBeInstanceOf(Date);
    });

    it('should confirm without witness', async () => {
      const movement = { id: 'm1', movementStatus: VaultMovementStatus.PENDING };
      movementRepo.findOne.mockResolvedValue(movement);
      movementRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.confirmMovement('m1', 'supervisor-1');
      expect(result.movementStatus).toBe(VaultMovementStatus.COMPLETED);
    });

    it('should throw BadRequestException when movement is not pending', async () => {
      movementRepo.findOne.mockResolvedValue({
        id: 'm1',
        movementStatus: VaultMovementStatus.COMPLETED,
      });
      await expect(service.confirmMovement('m1', 'supervisor-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when movement not found', async () => {
      movementRepo.findOne.mockResolvedValue(null);
      await expect(service.confirmMovement('nonexistent', 'supervisor-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // cancelMovement
  // ═══════════════════════════════════════════════════
  describe('cancelMovement', () => {
    it('should cancel a pending movement', async () => {
      const movement = { id: 'm1', movementStatus: VaultMovementStatus.PENDING };
      movementRepo.findOne.mockResolvedValue(movement);
      movementRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.cancelMovement('m1', 'Error in amount', 'user-1');
      expect(result.movementStatus).toBe(VaultMovementStatus.CANCELLED);
      expect(result.authorizationNotes).toBe('Error in amount');
    });

    it('should throw BadRequestException when movement is not pending', async () => {
      movementRepo.findOne.mockResolvedValue({
        id: 'm1',
        movementStatus: VaultMovementStatus.COMPLETED,
      });
      await expect(service.cancelMovement('m1', 'reason', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when movement not found', async () => {
      movementRepo.findOne.mockResolvedValue(null);
      await expect(service.cancelMovement('nonexistent', 'reason', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // reverseMovement
  // ═══════════════════════════════════════════════════
  describe('reverseMovement', () => {
    it('should reverse a completed CASH_IN movement', async () => {
      const movement = {
        id: 'm1',
        vaultId: 'v1',
        movementType: VaultMovementType.CASH_IN,
        amountTotal: 5000,
        movementStatus: VaultMovementStatus.COMPLETED,
      };
      movementRepo.findOne.mockResolvedValue(movement);
      movementRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      const mockVault = { id: 'v1', currentBalanceTotal: 50000 };
      vaultRepo.findOne.mockResolvedValue(mockVault);
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.reverseMovement('m1', 'Customer dispute', 'admin-1');
      expect(result.movementStatus).toBe(VaultMovementStatus.REVERSED);
      expect(result.reversedAt).toBeInstanceOf(Date);
    });

    it('should reverse a completed CASH_OUT movement', async () => {
      const movement = {
        id: 'm1',
        vaultId: 'v1',
        movementType: VaultMovementType.CASH_OUT,
        amountTotal: 5000,
        movementStatus: VaultMovementStatus.COMPLETED,
      };
      movementRepo.findOne.mockResolvedValue(movement);
      movementRepo.save.mockImplementation((input: any) => Promise.resolve(input));
      vaultRepo.findOne.mockResolvedValue({ id: 'v1', currentBalanceTotal: 50000 });
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.reverseMovement('m1', 'Error', 'admin-1');
      expect(result.movementStatus).toBe(VaultMovementStatus.REVERSED);
    });

    it('should throw BadRequestException when movement is not completed', async () => {
      movementRepo.findOne.mockResolvedValue({
        id: 'm1',
        movementStatus: VaultMovementStatus.PENDING,
      });
      await expect(service.reverseMovement('m1', 'reason', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when movement not found', async () => {
      movementRepo.findOne.mockResolvedValue(null);
      await expect(service.reverseMovement('nonexistent', 'reason', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // getMovements
  // ═══════════════════════════════════════════════════
  describe('getMovements', () => {
    it('should return movements without filters', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'm1' }]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getMovements();
      expect(result).toHaveLength(1);
      expect(mockQB.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by vaultId', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getMovements('v1');
      expect(mockQB.andWhere).toHaveBeenCalledWith('mv.vaultId = :vaultId', { vaultId: 'v1' });
    });

    it('should filter by movementType', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getMovements(undefined, VaultMovementType.CASH_IN);
      expect(mockQB.andWhere).toHaveBeenCalledWith('mv.movementType = :movementType', {
        movementType: VaultMovementType.CASH_IN,
      });
    });

    it('should filter by status', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getMovements(undefined, undefined, VaultMovementStatus.COMPLETED);
      expect(mockQB.andWhere).toHaveBeenCalledWith('mv.movementStatus = :status', {
        status: VaultMovementStatus.COMPLETED,
      });
    });

    it('should filter by date range', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await service.getMovements(undefined, undefined, undefined, from, to);
      expect(mockQB.andWhere).toHaveBeenCalledWith('mv.createdAt >= :fromDate', { fromDate: from });
      expect(mockQB.andWhere).toHaveBeenCalledWith('mv.createdAt <= :toDate', { toDate: to });
    });

    it('should apply all filters simultaneously', async () => {
      const mockQB = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getMovements('v1', VaultMovementType.CASH_IN, VaultMovementStatus.PENDING,
        new Date('2026-01-01'), new Date('2026-12-31'));
      expect(mockQB.andWhere).toHaveBeenCalledTimes(5);
    });
  });

  // ═══════════════════════════════════════════════════
  // getCurrentBalance
  // ═══════════════════════════════════════════════════
  describe('getCurrentBalance', () => {
    it('should return current balance info', async () => {
      const mockVault = {
        id: 'v1',
        vaultIdentifier: 'VAULT-01',
        currentBalanceTotal: 50000,
        lastAuditAt: new Date('2026-07-01'),
      };
      vaultRepo.findOne.mockResolvedValue(mockVault);

      const result = await service.getCurrentBalance('v1');
      expect(result.vaultId).toBe('v1');
      expect(result.vaultIdentifier).toBe('VAULT-01');
      expect(result.currentBalanceTotal).toBe(50000);
      expect(result.lastAuditAt).toEqual(new Date('2026-07-01'));
    });

    it('should return null lastAuditAt when never audited', async () => {
      vaultRepo.findOne.mockResolvedValue({
        id: 'v1',
        vaultIdentifier: 'VAULT-01',
        currentBalanceTotal: 0,
        lastAuditAt: null,
      });

      const result = await service.getCurrentBalance('v1');
      expect(result.lastAuditAt).toBeNull();
    });

    it('should return 0 when currentBalanceTotal is null', async () => {
      vaultRepo.findOne.mockResolvedValue({
        id: 'v1',
        vaultIdentifier: 'VAULT-01',
        currentBalanceTotal: null,
        lastAuditAt: null,
      });

      const result = await service.getCurrentBalance('v1');
      expect(result.currentBalanceTotal).toBe(0);
    });

    it('should throw NotFoundException when vault not found', async () => {
      vaultRepo.findOne.mockResolvedValue(null);
      await expect(service.getCurrentBalance('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // registerAudit
  // ═══════════════════════════════════════════════════
  describe('registerAudit', () => {
    it('should register audit with no variance', async () => {
      const mockVault = { id: 'v1', lastAuditAt: null, lastAuditedBy: null, varianceAmount: null };
      vaultRepo.findOne.mockResolvedValue(mockVault);
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.registerAudit('v1', 'auditor-1', 50000, 0);
      expect(mockVault.lastAuditAt).toBeInstanceOf(Date);
      expect(mockVault.lastAuditedBy).toBe('auditor-1');
      expect(vaultRepo.save).toHaveBeenCalled();
    });

    it('should set varianceAmount when variance > 0.01', async () => {
      const mockVault = { id: 'v1', lastAuditAt: null, lastAuditedBy: null, varianceAmount: null };
      vaultRepo.findOne.mockResolvedValue(mockVault);
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.registerAudit('v1', 'auditor-1', 49000, -1000);
      expect(mockVault.varianceAmount).toBe(-1000);
    });

    it('should not set varianceAmount when variance is negligible', async () => {
      const mockVault = { id: 'v1', lastAuditAt: null, lastAuditedBy: null, varianceAmount: null };
      vaultRepo.findOne.mockResolvedValue(mockVault);
      vaultRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      await service.registerAudit('v1', 'auditor-1', 50000, 0.005);
      expect(mockVault.varianceAmount).toBeNull();
    });

    it('should throw NotFoundException when vault not found', async () => {
      vaultRepo.findOne.mockResolvedValue(null);
      await expect(service.registerAudit('nonexistent', 'auditor-1', 50000)).rejects.toThrow(NotFoundException);
    });
  });
});
