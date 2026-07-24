import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryFramework } from '../entities/regulatory-framework.entity';

@Injectable()
export class FrameworkService {
  constructor(
    @InjectRepository(RegulatoryFramework)
    private frameworkRepo: Repository<RegulatoryFramework>,
  ) {}

  async create(frameworkData: Partial<RegulatoryFramework>): Promise<RegulatoryFramework> {
    const framework = this.frameworkRepo.create(frameworkData);
    return this.frameworkRepo.save(framework);
  }

  async findAll(): Promise<RegulatoryFramework[]> {
    return this.frameworkRepo.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<RegulatoryFramework> {
    const framework = await this.frameworkRepo.findOne({ where: { id } });
    if (!framework) {
      throw new NotFoundException(`Framework ${id} not found`);
    }
    return framework;
  }

  async findByCode(code: string): Promise<RegulatoryFramework> {
    const framework = await this.frameworkRepo.findOne({ where: { frameworkCode: code } });
    if (!framework) {
      throw new NotFoundException(`Framework code ${code} not found`);
    }
    return framework;
  }

  async update(id: string, updates: Partial<RegulatoryFramework>): Promise<RegulatoryFramework> {
    await this.findOne(id);
    Object.assign(updates, { updatedAt: new Date() });
    await this.frameworkRepo.update(id, updates);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<RegulatoryFramework> {
    return this.update(id, { isActive: false });
  }
}
