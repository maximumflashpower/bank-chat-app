import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllocationService } from './allocation.service';
import { OverheadAllocationMethod } from '../entities/overhead-allocation-method.entity';
import { AllocationDriver } from '../entities/allocation-driver.enum';
import { AllocationFrequency } from '../entities/allocation-frequency.enum';
import { NotFoundException } from '@nestjs/common';

describe('AllocationService', () => {
  let service: AllocationService;
  let repo: Repository<OverheadAllocationMethod>;

  const mockMethod = {
    id: 'method-uuid-1',
    companyId: 'company-uuid-1',
    methodName: 'Overhead by Sales',
    description: 'Allocates based on sales',
    driverType: AllocationDriver.SALES,
    frequency: AllocationFrequency.MONTHLY,
    driverSources: {},
    fixedRate: 10000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllocationService,
        {
          provide: getRepositoryToken(OverheadAllocationMethod),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AllocationService>(AllocationService);
    repo = module.get<Repository<OverheadAllocationMethod>>(getRepositoryToken(OverheadAllocationMethod));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createMethod', () => {
    it('should create an allocation method', async () => {
      const dto = {
        companyId: 'company-uuid-1',
        methodName: 'Overhead by Sales',
        description: 'Allocates based on sales',
        driverType: AllocationDriver.SALES,
        frequency: AllocationFrequency.MONTHLY,
        fixedRate: 10000
      };

      jest.spyOn(repo, 'create').mockReturnValue(mockMethod as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);

      const result = await service.createMethod(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.methodName).toBe('Overhead by Sales');
    });
  });

  describe('findAll', () => {
    it('should return all methods for a company', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([mockMethod] as any);
      const result = await service.findAll('company-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return method by id', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockMethod, fixedRate: 10000 } as any);
      const result = await service.findById('method-uuid-1');
      expect(result).toEqual(mockMethod);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update method fields', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockMethod, fixedRate: 10000 } as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.update('method-uuid-1', { fixedRate: 15000 });
      expect(result.fixedRate).toBe(15000);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockMethod, fixedRate: 10000 } as any);
      jest.spyOn(repo, 'save').mockImplementation(async (entity: any) => entity);
      const result = await service.deactivate('method-uuid-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('runAllocation', () => {
    it('should allocate proportionally', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockMethod, fixedRate: 10000 } as any);

      const departments = [
        { name: 'Sales', driverValue: 50000 },
        { name: 'Marketing', driverValue: 50000 }
      ];

      const result = await service.runAllocation('method-uuid-1', departments);

      expect(result).toHaveLength(2);
      expect(result[0].allocatedAmount).toBe(5000);
      expect(result[1].allocatedAmount).toBe(5000);
    });

    it('should handle zero total driver value', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue({ ...mockMethod, fixedRate: 10000 } as any);

      const departments = [
        { name: 'Dept A', driverValue: 0 },
        { name: 'Dept B', driverValue: 0 }
      ];

      const result = await service.runAllocation('method-uuid-1', departments);

      expect(result).toHaveLength(2);
      expect(result[0].allocatedAmount).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete method', async () => {
      jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 1 } as any);
      await service.delete('method-uuid-1');
      expect(repo.delete).toHaveBeenCalledWith('method-uuid-1');
    });
  });
});
