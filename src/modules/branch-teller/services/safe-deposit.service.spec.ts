import { SafeDepositService } from './safe-deposit.service';
import { SafeDepositBoxStatus, SafeDepositBoxSize } from '../entities/teller-safe-deposit-box.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SafeDepositService', () => {
  let service: SafeDepositService;
  let safeBoxRepo: any;

  beforeEach(() => {
    safeBoxRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new SafeDepositService(safeBoxRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════
  // rentBox
  // ═══════════════════════════════════════════════════
  describe('rentBox', () => {
    const baseDto = {
      boxNumber: 'BOX-001',
      branchId: 'b1',
      customerId: 'c1',
      billingAccountId: 'acc-1',
    };
    const mockBox = {
      id: 'sb1',
      boxNumber: 'BOX-001',
      branchId: 'b1',
      boxStatus: SafeDepositBoxStatus.AVAILABLE,
    };

    it('should rent an available box successfully', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.rentBox(baseDto as any);
      expect(result.boxStatus).toBe(SafeDepositBoxStatus.RENTED);
      expect(result.customerId).toBe('c1');
      expect(result.rentalStartDate).toBeInstanceOf(Date);
      expect(result.rentalEndDate).toBeInstanceOf(Date);
      expect(result.autoRenew).toBe(true);
      expect(result.currencyCode).toBe('USD');
    });

    it('should set jointRenterId when provided', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.rentBox({ ...baseDto, jointRenterId: 'c2' } as any);
      expect(result.jointRenterId).toBe('c2');
    });

    it('should use provided currencyCode', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.rentBox({ ...baseDto, currencyCode: 'EUR' } as any);
      expect(result.currencyCode).toBe('EUR');
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.rentBox(baseDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when box is not available', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        boxStatus: SafeDepositBoxStatus.RENTED,
      });
      await expect(service.rentBox(baseDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // registerAccess
  // ═══════════════════════════════════════════════════
  describe('registerAccess', () => {
    const baseDto = {
      safeDepositBoxId: 'sb1',
      customerId: 'c1',
    };
    const mockBox = {
      id: 'sb1',
      boxNumber: 'BOX-001',
      boxStatus: SafeDepositBoxStatus.RENTED,
      customerId: 'c1',
      jointRenterId: null,
      overduePayment: false,
      dualControlRequired: false,
      totalAccessCount: 5,
    };

    it('should register access for the renter', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerAccess(baseDto as any);
      expect(result.lastAccessedAt).toBeInstanceOf(Date);
      expect(result.lastAccessedByCustomerId).toBe('c1');
      expect(result.totalAccessCount).toBe(6);
    });

    it('should register access for joint renter', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        customerId: 'c1',
        jointRenterId: 'c2',
      });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerAccess({
        ...baseDto,
        customerId: 'c2',
      } as any);
      expect(result.lastAccessedByCustomerId).toBe('c2');
    });

    it('should register witness when dual control required', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        dualControlRequired: true,
      });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.registerAccess({
        ...baseDto,
        witnessUserId: 'emp-1',
      } as any);
      expect(result.lastAccessedByUserId).toBe('emp-1');
    });

    it('should throw BadRequestException when dual control required but no witness', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        dualControlRequired: true,
      });
      await expect(service.registerAccess(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when customer is not authorized', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        customerId: 'c1',
        jointRenterId: 'c2',
      });
      await expect(
        service.registerAccess({ ...baseDto, customerId: 'c3' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when box has overdue payment', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        overduePayment: true,
        overdueAmount: 100,
      });
      await expect(service.registerAccess(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when box is not rented', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        boxStatus: SafeDepositBoxStatus.AVAILABLE,
      });
      await expect(service.registerAccess(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.registerAccess(baseDto as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // returnBox
  // ═══════════════════════════════════════════════════
  describe('returnBox', () => {
    const baseDto = {
      safeDepositBoxId: 'sb1',
      customerId: 'c1',
    };
    const mockBox = {
      id: 'sb1',
      boxNumber: 'BOX-001',
      boxStatus: SafeDepositBoxStatus.RENTED,
      customerId: 'c1',
      overduePayment: false,
      totalAccessCount: 5,
    };

    it('should return box and set status to AVAILABLE', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.returnBox(baseDto as any);
      expect(result.boxStatus).toBe(SafeDepositBoxStatus.AVAILABLE);
      expect(result.customerId).toBeUndefined();
      expect(result.totalAccessCount).toBe(0);
      expect(result.autoRenew).toBe(false);
    });

    it('should store return notes when provided', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ ...mockBox });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.returnBox({
        ...baseDto,
        returnNotes: 'Keys returned',
      } as any);
      expect(result.notes).toBe('Keys returned');
    });

    it('should throw BadRequestException when customer is not the renter', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        customerId: 'c2',
      });
      await expect(service.returnBox(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when box has overdue payment', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        overduePayment: true,
        overdueAmount: 50,
      });
      await expect(service.returnBox(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when box is not rented', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        ...mockBox,
        boxStatus: SafeDepositBoxStatus.AVAILABLE,
      });
      await expect(service.returnBox(baseDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.returnBox(baseDto as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // listByCustomer
  // ═══════════════════════════════════════════════════
  describe('listByCustomer', () => {
    it('should return boxes for a customer', async () => {
      const mockBoxes = [
        { id: 'sb1', customerId: 'c1' },
        { id: 'sb2', customerId: 'c1' },
      ];
      safeBoxRepo.find.mockResolvedValue(mockBoxes);

      const result = await service.listByCustomer('c1');
      expect(result).toHaveLength(2);
      expect(safeBoxRepo.find).toHaveBeenCalledWith({
        where: { customerId: 'c1' },
        order: { rentalStartDate: 'DESC' },
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // listByBranch
  // ═══════════════════════════════════════════════════
  describe('listByBranch', () => {
    it('should return boxes for a branch without status filter', async () => {
      safeBoxRepo.find.mockResolvedValue([{ id: 'sb1' }]);
      const result = await service.listByBranch('b1');
      expect(result).toHaveLength(1);
      expect(safeBoxRepo.find).toHaveBeenCalledWith({
        where: { branchId: 'b1' },
        order: { boxNumber: 'ASC' },
      });
    });

    it('should filter by status when provided', async () => {
      safeBoxRepo.find.mockResolvedValue([]);
      await service.listByBranch('b1', SafeDepositBoxStatus.AVAILABLE);
      expect(safeBoxRepo.find).toHaveBeenCalledWith({
        where: { branchId: 'b1', boxStatus: SafeDepositBoxStatus.AVAILABLE },
        order: { boxNumber: 'ASC' },
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════
  describe('getById', () => {
    it('should return box by ID', async () => {
      const mockBox = { id: 'sb1', boxNumber: 'BOX-001' };
      safeBoxRepo.findOne.mockResolvedValue(mockBox);
      const result = await service.getById('sb1');
      expect(result).toBe(mockBox);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // createBox
  // ═══════════════════════════════════════════════════
  describe('createBox', () => {
    const baseData = {
      boxNumber: 'BOX-NEW',
      branchId: 'b1',
      boxSize: SafeDepositBoxSize.MEDIUM,
      annualRentalFee: 150,
    };

    it('should create a new box successfully', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      safeBoxRepo.create.mockImplementation((data: any) => ({ ...data }));
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createBox(baseData as any);
      expect(result.boxStatus).toBe(SafeDepositBoxStatus.AVAILABLE);
      expect(result.currencyCode).toBe('USD');
      expect(result.requiredKeysCount).toBe(2);
      expect(result.dualControlRequired).toBe(true);
      expect(result.totalAccessCount).toBe(0);
    });

    it('should use custom requiredKeysCount and dualControlRequired', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      safeBoxRepo.create.mockImplementation((data: any) => ({ ...data }));
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.createBox({
        ...baseData,
        requiredKeysCount: 3,
        dualControlRequired: false,
      } as any);
      expect(result.requiredKeysCount).toBe(3);
      expect(result.dualControlRequired).toBe(false);
    });

    it('should throw BadRequestException when box already exists', async () => {
      safeBoxRepo.findOne.mockResolvedValue({ id: 'sb1', boxNumber: 'BOX-NEW' });
      await expect(service.createBox(baseData as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════
  // setMaintenance
  // ═══════════════════════════════════════════════════
  describe('setMaintenance', () => {
    it('should set an available box to maintenance', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.AVAILABLE,
      });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.setMaintenance('sb1', 'Lock repair');
      expect(result.boxStatus).toBe(SafeDepositBoxStatus.MAINTENANCE);
      expect(result.notes).toContain('Lock repair');
    });

    it('should throw BadRequestException when box is rented', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.RENTED,
      });
      await expect(service.setMaintenance('sb1', 'reason'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.setMaintenance('nonexistent', 'reason'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // reactivateBox
  // ═══════════════════════════════════════════════════
  describe('reactivateBox', () => {
    it('should reactivate a box from maintenance', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.MAINTENANCE,
      });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.reactivateBox('sb1');
      expect(result.boxStatus).toBe(SafeDepositBoxStatus.AVAILABLE);
    });

    it('should throw BadRequestException when box is not in maintenance', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.AVAILABLE,
      });
      await expect(service.reactivateBox('sb1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.reactivateBox('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════
  // renewRental
  // ═══════════════════════════════════════════════════
  describe('renewRental', () => {
    it('should renew rental for a rented box', async () => {
      const oldEndDate = new Date('2026-12-31');
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.RENTED,
        rentalEndDate: oldEndDate,
        overduePayment: true,
        overdueAmount: 50,
      });
      safeBoxRepo.save.mockImplementation((input: any) => Promise.resolve(input));

      const result = await service.renewRental('sb1', 'admin-1');
      // New end date should be 1 year after old end date
      expect(result.rentalEndDate.getFullYear()).toBe(oldEndDate.getFullYear() + 1);
      expect(result.overduePayment).toBe(false);
      expect(result.overdueAmount).toBeUndefined();
    });

    it('should throw BadRequestException when box is not rented', async () => {
      safeBoxRepo.findOne.mockResolvedValue({
        id: 'sb1',
        boxStatus: SafeDepositBoxStatus.AVAILABLE,
      });
      await expect(service.renewRental('sb1', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when box not found', async () => {
      safeBoxRepo.findOne.mockResolvedValue(null);
      await expect(service.renewRental('nonexistent', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
