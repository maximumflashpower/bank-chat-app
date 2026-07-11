import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntryLog } from '../entities/time-entry-log.entity';
import { TimeApprovalStatus } from '../entities/time-approval-status.enum';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntryLog)
    private timeEntryRepo: Repository<TimeEntryLog>
  ) {}

  async logTime(dto: { projectId: string; userId: string; entryDate: string; hoursLogged: number; taskDescription?: string; hourlyRate?: number }): Promise<TimeEntryLog> {
    const entry = this.timeEntryRepo.create({});
    Object.assign(entry, {
      projectId: dto.projectId,
      userId: dto.userId,
      entryDate: new Date(dto.entryDate),
      hoursLogged: dto.hoursLogged,
      taskDescription: dto.taskDescription ?? null,
      hourlyRate: dto.hourlyRate ?? null,
      billableAmount: dto.hourlyRate ? dto.hourlyRate * dto.hoursLogged : null,
      approvalStatus: TimeApprovalStatus.PENDING
    });
    return this.timeEntryRepo.save(entry);
  }

  async findByProject(projectId: string): Promise<TimeEntryLog[]> {
    return this.timeEntryRepo.find({ where: { projectId }, order: { entryDate: 'DESC' } });
  }

  async findByUser(userId: string): Promise<TimeEntryLog[]> {
    return this.timeEntryRepo.find({ where: { userId }, order: { entryDate: 'DESC' } });
  }

  async approveEntry(id: string, approvedBy: string): Promise<TimeEntryLog> {
    const entry = await this.timeEntryRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Time entry ${id} not found`);
    }
    entry.approvalStatus = TimeApprovalStatus.APPROVED;
    entry.approvedBy = approvedBy;
    entry.approvedAt = new Date();
    return this.timeEntryRepo.save(entry);
  }

  async rejectEntry(id: string, reason: string): Promise<TimeEntryLog> {
    const entry = await this.timeEntryRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Time entry ${id} not found`);
    }
    entry.approvalStatus = TimeApprovalStatus.REJECTED;
    entry.rejectionReason = reason;
    return this.timeEntryRepo.save(entry);
  }

  async getTotalHours(projectId: string): Promise<number> {
    const entries = await this.findByProject(projectId);
    return entries.reduce((sum, e) => sum + e.hoursLogged, 0);
  }

  async getTotalBillableAmount(projectId: string): Promise<number> {
    const entries = await this.findByProject(projectId);
    return entries.reduce((sum, e) => sum + (e.billableAmount ?? 0), 0);
  }
}
