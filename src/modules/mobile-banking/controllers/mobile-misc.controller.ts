import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';
import { SpendingInsightService } from '../services/spending-insight.service';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackStatus } from '../enums/mobile.enums';

interface FeedbackDto {
  rating: number;
  feedbackType: string;
  comment?: string;
  screenContext?: string;
  deviceInfo?: Record<string, any>;
}

@Controller('api/v1/mobile')
@UseGuards(AuthGuard('jwt'))
export class MobileMiscController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly spendingInsightService: SpendingInsightService,
  ) {}

  @Post('/feedback/submit')
  async submitFeedback(@Body() dto: FeedbackDto) {
    const userId = 'user-from-jwt';
    return this.feedbackService.submit({ userId, ...dto });
  }

  @Post('/spending-insights')
  async getSpendingInsights(@Body() body: { startDate: string; endDate: string }) {
    return this.spendingInsightService.getCategorizedSpending(
      'user-from-jwt',
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Get('/quick-actions/config')
  async getQuickActions() {
    // Stub - implementar desde mobile-quick-action entity
    return [];
  }

  @Put('/quick-actions/update')
  async updateQuickActions(@Body() actions: any[]) {
    // Stub
    return { updated: true };
  }
}
