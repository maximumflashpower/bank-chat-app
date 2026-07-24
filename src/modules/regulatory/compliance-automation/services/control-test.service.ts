import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryControlTest } from '../entities/regulatory-control-test.entity';

@Injectable()
export class ControlTestService {
  constructor(
    @InjectRepository(RegulatoryControlTest)
    private controlTestRepo: Repository<RegulatoryControlTest>,
  ) {}

  async create(testData: Partial<RegulatoryControlTest>): Promise<RegulatoryControlTest> {
    const test = this.controlTestRepo.create(testData);
    return this.controlTestRepo.save(test);
  }

  async findByControl(controlId: string): Promise<RegulatoryControlTest[]> {
    return this.controlTestRepo.find({ where: { controlId }, order: { testDate: 'DESC' } });
  }

  async findOne(id: string): Promise<RegulatoryControlTest> {
    const test = await this.controlTestRepo.findOne({ where: { id } });
    if (!test) {
      throw new NotFoundException(`Control test ${id} not found`);
    }
    return test;
  }

  async updateStatus(id: string, status: 'in_remediation' | 're_tested'): Promise<RegulatoryControlTest> {
    await this.findOne(id);
    await this.controlTestRepo.update(id, { status, updatedAt: new Date() });
    return this.findOne(id);
  }

  async addEvidence(id: string, evidencePath: string, findings: string, remediationPlan: string): Promise<RegulatoryControlTest> {
    await this.findOne(id);
    await this.controlTestRepo.update(id, { evidencePath, findings, remediationPlan });
    return this.findOne(id);
  }

  async markPassed(id: string): Promise<RegulatoryControlTest> {
    await this.findOne(id);
    await this.controlTestRepo.update(id, { result: 'pass', status: 'completed' });
    return this.findOne(id);
  }
}
