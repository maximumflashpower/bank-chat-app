import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceTraining } from '../entities/compliance-training.entity';

@Injectable()
export class ComplianceTrainingService {
  private readonly logger = new Logger(ComplianceTrainingService.name);

  constructor(
    @InjectRepository(ComplianceTraining)
    private readonly trainingRepo: Repository<ComplianceTraining>,
  ) {}

  /**
   * REG-TRAINING-001: Assign and track compliance training
   */
  async assignTraining(employeeId: string, courseName: string, category: string, dueDate: Date): Promise<ComplianceTraining> {
    const training = Object.assign(new ComplianceTraining(), {
      employeeId,
      courseName,
      courseCategory: category,
      completed: false,
      score: null,
      completedAt: null,
      dueDate,
      status: 'assigned',
    });

    const saved = await this.trainingRepo.save(training) as unknown as ComplianceTraining;
    this.logger.log(`Assigned training '${courseName}' to employee ${employeeId}, due: ${dueDate}`);
    return saved;
  }

  /**
   * Complete training with score
   */
  async completeTraining(trainingId: string, score: number): Promise<ComplianceTraining> {
    const training = await this.trainingRepo.findOne({ where: { id: trainingId } });
    if (!training) {
      throw new NotFoundException(`Training ${trainingId} not found`);
    }

    training.completed = true;
    training.score = score;
    training.completedAt = new Date();
    training.status = score >= 80 ? 'passed' : 'failed';

    const saved = await this.trainingRepo.save(training) as unknown as ComplianceTraining;
    this.logger.log(`Training ${trainingId} completed by ${training.employeeId}, score: ${score}%`);
    return saved;
  }

  /**
   * Get annual certification report
   */
  async getAnnualCertificationReport(year: number): Promise<{
    totalEmployees: number;
    trainedCount: number;
    passedCount: number;
    failedCount: number;
    completionRate: number;
  }> {
    const trainings = await this.trainingRepo.find();
    const employees = [...new Set(trainings.map(t => t.employeeId))];
    const completed = trainings.filter(t => t.completed);
    const passed = trainings.filter(t => t.status === 'passed');
    const failed = trainings.filter(t => t.status === 'failed');

    return {
      totalEmployees: employees.length,
      trainedCount: completed.length,
      passedCount: passed.length,
      failedCount: failed.length,
      completionRate: employees.length ? (completed.length / employees.length) * 100 : 0,
    };
  }

  async findAll(): Promise<ComplianceTraining[]> {
    return this.trainingRepo.find({ order: { dueDate: 'ASC' } });
  }

  async findByEmployee(employeeId: string): Promise<ComplianceTraining[]> {
    return this.trainingRepo.find({ where: { employeeId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<ComplianceTraining | null> {
    return this.trainingRepo.findOne({ where: { id } });
  }
}
