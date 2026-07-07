import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRecurringTemplate } from '../entities/ai-recurring-template.entity';
import { RecurringSetupDto } from '../dto/recurring-setup.dto';

@Injectable()
export class RecurringEntryService {
  constructor(
    @InjectRepository(AiRecurringTemplate)
    private repo: Repository<AiRecurringTemplate>,
  ) {}

  async setup(dto: RecurringSetupDto): Promise<AiRecurringTemplate> {
    const template = this.repo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      nextScheduledAt: new Date(dto.startDate),
    });
    return this.repo.save(template);
  }

  async findAll(): Promise<AiRecurringTemplate[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<AiRecurringTemplate | null> {
    return this.repo.findOne({ where: { id } });
  }

  async generateDueEntries(): Promise<{ generated: number }> {
    const now = new Date();
    const dueTemplates = await this.repo.find();

    let generated = 0;
    for (const template of dueTemplates) {
      if (
        template.nextScheduledAt &&
        template.nextScheduledAt <= now &&
        (!template.endDate || template.endDate >= now) &&
        template.autoGenerate
      ) {
        const nextDate = this.calculateNextRun(template);
        await this.repo.update(template.id, {
          lastGeneratedAt: now,
          nextScheduledAt: nextDate,
          generatedCount: template.generatedCount + 1,
        });
        generated++;
      }
    }

    return { generated };
  }

  private calculateNextRun(template: AiRecurringTemplate): Date {
    const next = new Date(template.nextScheduledAt ?? new Date());
    switch (template.frequency) {
      case 'monthly':
        next.setMonth(next.getMonth() + template.frequencyInterval);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3 * template.frequencyInterval);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + template.frequencyInterval);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
    if (template.skipWeekend) {
      const day = next.getDay();
      if (day === 0) next.setDate(next.getDate() + 1);
      if (day === 6) next.setDate(next.getDate() + 2);
    }
    if (template.adjustFirstDay) {
      next.setDate(1);
    }
    return next;
  }

  async deactivate(id: string): Promise<void> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    await this.repo.update(id, { autoGenerate: false, endDate: new Date() });
  }
}
