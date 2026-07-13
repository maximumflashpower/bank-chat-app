import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { RegExam } from '../entities/reg-exam.entity';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamStatusDto } from '../dto/update-exam-status.dto';
import { CompileExamPackageDto } from '../dto/compile-exam-package.dto';

@Injectable()
export class RegulatoryExamService {
  private readonly logger = new Logger(RegulatoryExamService.name);

  constructor(
    @InjectRepository(RegExam)
    private readonly examRepo: Repository<RegExam>,
  ) {}

  /**
   * REG-EXAM-001: Create regulatory exam
   */
  async createExam(dto: CreateExamDto): Promise<RegExam> {
    const exam = this.examRepo.create({
      examinerAgency: dto.examinerAgency,
      examType: dto.examType,
      scope: dto.scope,
      receivedDate: new Date(dto.receivedDate),
      responseDeadline: new Date(dto.responseDeadline),
      assignedTeam: dto.assignedTeam || [],
      documentIds: [],
      priority: dto.priority || 'high',
      status: 'open',
      followUpRequired: false,
    });

    const saved = await this.examRepo.save(exam);
    this.logger.log(`Regulatory exam created: ${saved.id} - ${dto.examinerAgency}`);
    return saved;
  }

  /**
   * REG-EXAM-001: List all exams with filters
   */
  async findAll(status?: string, agency?: string): Promise<RegExam[]> {
    const queryBuilder = this.examRepo.createQueryBuilder('exam');

    if (status) {
      queryBuilder.where('exam.status = :status', { status });
    }
    if (agency) {
      queryBuilder.andWhere('exam.examinerAgency ILIKE :agency', { agency: `%${agency}%` });
    }

    queryBuilder.orderBy('exam.responseDeadline', 'ASC');
    return queryBuilder.getMany();
  }

  /**
   * REG-EXAM-002: Update exam status + deadline tracking
   */
  async updateStatus(id: string, dto: UpdateExamStatusDto): Promise<RegExam> {
    const exam = await this.examRepo.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam ${id} not found`);
    }

    exam.status = dto.status;
    if (dto.result !== undefined) exam.result = dto.result;
    if (dto.followUpRequired !== undefined) exam.followUpRequired = dto.followUpRequired;
    
    if (dto.status === 'submitted') {
      exam.submittedAt = new Date();
    }

    const saved = await this.examRepo.save(exam);
    this.logger.log(`Exam ${id} status updated to ${dto.status}`);
    return saved;
  }

  /**
   * REG-EXAM-003: Compile exam package (document aggregation)
   */
  async compileExamPackage(dto: CompileExamPackageDto): Promise<{ examId: string; documentCount: number; url: string }> {
    const exam = await this.examRepo.findOne({ where: { id: dto.examId } });
    if (!exam) {
      throw new NotFoundException(`Exam ${dto.examId} not found`);
    }

    // Simular compilation - en prod integrar con storage module
    const documentCount = dto.documentIds?.length || exam.documentIds.length || 0;
    const packageUrl = `/storage/packages/${dto.examId}-${Date.now()}.zip`;

    this.logger.log(`Compiled exam package for ${exam.examinerAgency}: ${documentCount} documents`);
    return {
      examId: dto.examId,
      documentCount,
      url: packageUrl,
    };
  }

  /**
   * REG-EXAM-004: Archive exam with 10-year retention
   */
  async archiveExam(id: string, resolvedBy: string): Promise<RegExam> {
    const exam = await this.examRepo.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam ${id} not found`);
    }

    if (exam.status !== 'closed') {
      exam.status = 'closed';
      exam.resolvedBy = resolvedBy;
      
      const saved = await this.examRepo.save(exam);
      this.logger.log(`Exam ${id} archived by ${resolvedBy}`);
      return saved;
    }

    return exam;
  }

  /**
   * Get deadline warnings (exams expiring soon)
   */
  async getDeadlineWarnings(daysThreshold: number = 7): Promise<RegExam[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);

    return this.examRepo.find({
      where: {
        status: In(['open', 'in_progress']),
        responseDeadline: LessThan(targetDate),
      },
      order: { responseDeadline: 'ASC' },
    });
  }

  /**
   * REG-EXAM-001: Get single exam
   */
  async findById(id: string): Promise<RegExam | null> {
    return this.examRepo.findOne({ where: { id } });
  }
}
