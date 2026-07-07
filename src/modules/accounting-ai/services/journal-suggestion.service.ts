import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiJournalSuggestion } from '../entities/ai-journal-suggestion.entity';
import { ApproveEntryDto } from '../dto/approve-entry.dto';
import { RejectEntryDto } from '../dto/reject-entry.dto';

@Injectable()
export class JournalSuggestionService {
  constructor(
    @InjectRepository(AiJournalSuggestion)
    private repo: Repository<AiJournalSuggestion>,
  ) {}

  async createSuggestion(sourceDocumentId: string, suggestedEntry: any, confidenceScore: number): Promise<AiJournalSuggestion> {
    const suggestion = this.repo.create({
      sourceDocumentId,
      suggestedEntryJson: suggestedEntry,
      mlConfidenceScore: confidenceScore,
      status: 'pending_approval',
    });
    return this.repo.save(suggestion);
  }

  async findById(id: string): Promise<AiJournalSuggestion | null> {
    return this.repo.findOne({ where: { id } });
  }

  async listPending(): Promise<AiJournalSuggestion[]> {
    return this.repo.find({ where: { status: 'pending_approval' } });
  }

  async approve(id: string, dto: ApproveEntryDto): Promise<void> {
    await this.repo.update(id, {
      ...dto,
      status: 'approved',
      approvedAt: new Date(),
    });
  }

  async reject(id: string, dto: RejectEntryDto): Promise<void> {
    await this.repo.update(id, {
      ...dto,
      status: 'rejected',
    });
  }

  async listBySource(sourceDocumentId: string): Promise<AiJournalSuggestion[]> {
    return this.repo.find({ where: { sourceDocumentId } });
  }
}
