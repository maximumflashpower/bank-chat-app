import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileFeedback } from '../entities/mobile-feedback.entity';
import { FeedbackStatus } from '../enums/mobile.enums';

interface FeedbackInput {
  userId: string;
  rating: number;
  feedbackType: string;
  comment?: string;
  screenContext?: string;
  deviceInfo?: Record<string, any>;
}

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(MobileFeedback)
    private readonly repo: Repository<MobileFeedback>,
  ) {}

  async submit(input: FeedbackInput): Promise<MobileFeedback> {
    const feedback = new MobileFeedback();
    feedback.userId = input.userId;
    feedback.rating = input.rating;
    feedback.feedbackType = input.feedbackType;
    
    if (input.comment) feedback.comment = input.comment;
    if (input.screenContext) feedback.screenContext = input.screenContext;
    
    if (input.deviceInfo) feedback.deviceInfo = input.deviceInfo as any;
    
    feedback.status = FeedbackStatus.OPEN;

    return this.repo.save(feedback);
  }

  async getAll(status?: FeedbackStatus): Promise<MobileFeedback[]> {
    const query = this.repo.find();
    if (status) {
      (query as any).where = { status };
    }
    return query;
  }

  async updateStatus(feedbackId: string, status: FeedbackStatus): Promise<MobileFeedback> {
    const fb = await this.repo.findOne({ where: { id: feedbackId } });
    if (!fb) throw new NotFoundException('Feedback not found');

    fb.status = status;
    return this.repo.save(fb);
  }
}
