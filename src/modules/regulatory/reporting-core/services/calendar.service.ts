import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ReportingCalendar } from '../entities/reporting-calendar.entity';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(ReportingCalendar)
    private calendarRepo: Repository<ReportingCalendar>,
  ) {}

  async createEvent(
    eventTitle: string,
    eventType: 'filing_deadline' | 'submission' | 'audit' | 'review' | 'meeting' | 'training' | 'regulatory_change',
    filingType: string,
    startTime: Date,
    userId: string,
    options?: {
      description?: string;
      endTime?: Date;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      reminderDaysBefore?: number;
      relatedReports?: string[];
    },
  ): Promise<ReportingCalendar> {
    const event = this.calendarRepo.create({
      eventTitle,
      eventType,
      filingType,
      startTime,
      endTime: options?.endTime,
      description: options?.description,
      priority: options?.priority || 'normal',
      reminderDaysBefore: options?.reminderDaysBefore || 7,
      relatedReports: options?.relatedReports,
      status: 'pending',
      createdBy: userId,
    });

    const saved = await this.calendarRepo.save(event);
    this.logger.log(`Calendar event created: ${saved.id} - ${eventTitle}`);
    return saved;
  }

  async findById(id: string): Promise<ReportingCalendar> {
    const event = await this.calendarRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ReportingCalendar[]> {
    return this.calendarRepo.find({
      where: {
        startTime: MoreThan(startDate),
        endTime: LessThan(endDate),
      },
      order: { startTime: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<ReportingCalendar[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.calendarRepo.find({
      where: {
        startTime: MoreThan(now),
        endTime: LessThan(futureDate),
        status: 'pending',
      },
      order: { startTime: 'ASC' },
    });
  }

  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled'): Promise<ReportingCalendar> {
    const event = await this.findById(id);
    event.status = status;
    if (status === 'completed') {
      event.submittedAt = new Date();
    }
    return this.calendarRepo.save(event);
  }

  async markRemindersSent(id: string, recipient: string, method: 'email' | 'notification' | 'sms'): Promise<ReportingCalendar> {
    const event = await this.findById(id);
    const reminder = {
      sentAt: new Date().toISOString(),
      recipient,
      method,
    };
    event.remindersSent = [...(event.remindersSent || []), reminder];
    return this.calendarRepo.save(event);
  }

  async addChecklistItem(id: string, item: string, userId: string): Promise<ReportingCalendar> {
    const event = await this.findById(id);
    const checklistItem = {
      item,
      completed: false,
      completedBy: userId,
    };
    event.checklist = [...(event.checklist || []), checklistItem];
    return this.calendarRepo.save(event);
  }

  async completeChecklistItem(id: string, itemId: number, userId: string): Promise<ReportingCalendar> {
    const event = await this.findById(id);
    if (!event.checklist || !event.checklist[itemId]) {
      throw new NotFoundException(`Checklist item ${itemId} not found`);
    }
    event.checklist[itemId].completed = true;
    event.checklist[itemId].completedAt = new Date().toISOString();
    event.checklist[itemId].completedBy = userId;
    return this.calendarRepo.save(event);
  }

  async assignReviewer(id: string, reviewerId: string): Promise<ReportingCalendar> {
    const event = await this.findById(id);
    event.approvers = [...(event.approvers || []), {
      userId: reviewerId,
      status: 'pending',
    }];
    return this.calendarRepo.save(event);
  }
}
