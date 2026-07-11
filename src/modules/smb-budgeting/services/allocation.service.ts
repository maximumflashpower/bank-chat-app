import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OverheadAllocationMethod } from '../entities/overhead-allocation-method.entity';
import { CreateAllocationMethodDto } from '../dto/create-allocation-method.dto';

@Injectable()
export class AllocationService {
  constructor(
    @InjectRepository(OverheadAllocationMethod)
    private allocationRepo: Repository<OverheadAllocationMethod>
  ) {}

  async createMethod(dto: CreateAllocationMethodDto): Promise<OverheadAllocationMethod> {
    const method = this.allocationRepo.create(dto);
    return this.allocationRepo.save(method);
  }

  async findAll(companyId: string): Promise<OverheadAllocationMethod[]> {
    return this.allocationRepo.find({ where: { companyId } });
  }

  async findById(id: string): Promise<OverheadAllocationMethod> {
    const method = await this.allocationRepo.findOne({ where: { id } });
    if (!method) {
      throw new NotFoundException(`Allocation method ${id} not found`);
    }
    return method;
  }

  async update(id: string, dto: Partial<CreateAllocationMethodDto>): Promise<OverheadAllocationMethod> {
    const method = await this.findById(id);
    Object.assign(method, dto);
    return this.allocationRepo.save(method);
  }

  async deactivate(id: string): Promise<OverheadAllocationMethod> {
    const method = await this.findById(id);
    method.isActive = false;
    return this.allocationRepo.save(method);
  }

  async runAllocation(methodId: string, departments: { name: string; driverValue: number }[]): Promise<{ department: string; allocatedAmount: number }[]> {
    const method = await this.findById(methodId);
    const totalDriverValue = departments.reduce((s, d) => s + d.driverValue, 0);

    if (totalDriverValue === 0) {
      return departments.map(d => ({ department: d.name, allocatedAmount: 0 }));
    }

    const baseAmount = method.fixedRate ?? 0;

    return departments.map(d => ({
      department: d.name,
      allocatedAmount: baseAmount * (d.driverValue / totalDriverValue)
    }));
  }

  async delete(id: string): Promise<void> {
    await this.allocationRepo.delete(id);
  }
}
