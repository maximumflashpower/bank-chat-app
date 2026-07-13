import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryChange } from '../entities/regulatory-change.entity';

@Injectable()
export class RegulatoryChangeService {
  private readonly logger = new Logger(RegulatoryChangeService.name);

  constructor(
    @InjectRepository(RegulatoryChange)
    private readonly changeRepo: Repository<RegulatoryChange>,
  ) {}

  /**
   * REG-CHANGE-001: Monitor regulatory updates
   */
  async monitorRegulatoryUpdates(jurisdictions: string[]): Promise<RegulatoryChange[]> {
    // Simulación — en prod conectar a APIs de regulación o web scraping
    const dummyChanges: Partial<RegulatoryChange>[] = jurisdictions.map(j => ({
      title: `Updated regulation for ${j}`,
      jurisdiction: j,
      description: `Recent compliance changes applicable to ${j} operations`,
      changeType: 'amendment',
      effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      impactStatus: 'pending',
    }));

    const changes = [];
    for (const d of dummyChanges) {
      const change = Object.assign(new RegulatoryChange(), d);
      const saved = await this.changeRepo.save(change) as unknown as RegulatoryChange;
      changes.push(saved);
      this.logger.log(`New regulatory change detected: ${saved.title}`);
    }

    return changes;
  }

  /**
   * REG-CHANGE-002: Impact assessment automation
   */
  async assessImpact(changeId: string, assessment: string, actionPlan: string): Promise<RegulatoryChange> {
    const change = await this.changeRepo.findOne({ where: { id: changeId } });
    if (!change) {
      throw new Error(`Change ${changeId} not found`);
    }

    change.impactStatus = 'assessed';
    change.impactAssessment = assessment;
    change.actionPlan = actionPlan;

    const saved = await this.changeRepo.save(change) as unknown as RegulatoryChange;
    this.logger.log(`Impact assessed for ${changeId}: ${assessment}`);
    return saved;
  }

  async findAll(): Promise<RegulatoryChange[]> {
    return this.changeRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<RegulatoryChange | null> {
    return this.changeRepo.findOne({ where: { id } });
  }
}
