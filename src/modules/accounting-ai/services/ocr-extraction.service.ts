import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiOcrExtractionTask } from '../entities/ai-ocr-extraction-task.entity';
import { UploadDocumentDto } from '../dto/upload-document.dto';

@Injectable()
export class OcrExtractionService {
  constructor(
    @InjectRepository(AiOcrExtractionTask)
    private repo: Repository<AiOcrExtractionTask>,
  ) {}

  async processDocument(dto: UploadDocumentDto): Promise<AiOcrExtractionTask> {
    const task = this.repo.create({
      documentId: crypto.randomUUID(),
      ...dto,
      extractionStatus: 'processing',
    });
    return this.repo.save(task);
  }

  async findById(taskId: string): Promise<AiOcrExtractionTask | null> {
    return this.repo.findOne({ where: { id: taskId } });
  }

  async markCompleted(taskId: string, extractedData: any, confidenceScore: number): Promise<void> {
    await this.repo.update(taskId, {
      extractionStatus: 'completed',
      extractedDataJson: extractedData,
      confidenceScore,
      processingTimeMs: Date.now(),
    });
  }

  async markNeedsReview(taskId: string): Promise<void> {
    await this.repo.update(taskId, {
      extractionStatus: 'needs_review',
    });
  }
}
