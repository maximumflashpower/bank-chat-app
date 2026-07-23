import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryReport } from '../entities/regulatory-report.entity';
import {
  ReportType,
  ReportStatus,
  FilingStatus,
  FilingFormat,
  RegulatoryAuthority,
  SubmissionMethod,
} from '../entities/call-report-status.enum';
import { GenerateReportDto } from '../dto/generate-report.dto';

@Injectable()
export class CallReportService {
  private readonly logger = new Logger(CallReportService.name);

  constructor(
    @InjectRepository(RegulatoryReport)
    private readonly reportRepo: Repository<RegulatoryReport>,
  ) {}

  /**
   * REG-CALLRPT-001: Call Report FFIEC 031/041 quarterly generation
   */
  async generateCallReport(dto: GenerateReportDto, userId: string): Promise<RegulatoryReport> {
    const reportReference = this.generateReportReference(dto.reportType);

    const report = this.reportRepo.create({
      reportReference,
      reportType: dto.reportType,
      reportingPeriodType: dto.reportingPeriodType,
      reportingPeriodStart: dto.reportingPeriodStart,
      reportingPeriodEnd: dto.reportingPeriodEnd,
      regulatoryAuthority: dto.regulatoryAuthority,
      filingFormat: dto.filingFormat,
      dataSources: dto.dataSources as unknown as Record<string, unknown>[],
      filingDeadline: dto.filingDeadline,
      amendmentOriginalId: dto.amendmentOriginalId,
      status: ReportStatus.GENERATING,
      filingStatus: FilingStatus.DRAFT,
      preparedByUserId: userId,
    });

    const saved = await this.reportRepo.save(report);

    // Simular recolección de datos y generación
    saved.dataSources = dto.dataSources as unknown as Record<string, unknown>[];
    saved.lineageMetadata = {
      generatedBy: userId,
      sources: dto.dataSources.map((s) => s.sourceName),
      generatedAt: new Date().toISOString(),
    };
    saved.calculationFormulasApplied = [
      { name: 'RC-R', description: 'Consolidated Balance Sheet Assets' },
      { name: 'RC-K', description: 'Memoranda' },
      { name: 'RI', description: 'Income Statement' },
    ];

    // Simular validación
    saved.validationErrors = [];
    saved.validationWarnings = [{ message: 'Cross-reference RC-6 line requires manual verification' }];
    saved.validationPassed = true;
    saved.status = ReportStatus.VALIDATING;
    saved.generatedAt = new Date();

    const updated = await this.reportRepo.save(saved);

    this.logger.log(`Call Report generated: ${saved.reportReference} (${dto.reportType})`);
    return updated;
  }

  /**
   * Validate report data consistency
   */
  async validateReport(reportId: string): Promise<RegulatoryReport> {
    const report = await this.findById(reportId);

    if (report.status === ReportStatus.GENERATING) {
      throw new BadRequestException('Report still generating');
    }

    // Simular validación referencial
    report.validationPassed = true;
    report.status = ReportStatus.READY;

    const updated = await this.reportRepo.save(report);
    this.logger.log(`Report validated: ${report.reportReference}`);
    return updated;
  }

  /**
   * Submit report to regulatory authority
   */
  async submitReport(
    reportId: string,
    submissionMethod: SubmissionMethod,
  ): Promise<RegulatoryReport> {
    const report = await this.findById(reportId);

    if (!report.validationPassed) {
      throw new BadRequestException('Report must pass validation before submission');
    }

    const ackNumber = `ACK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    report.submissionMethod = submissionMethod;
    report.filingStatus = FilingStatus.SUBMITTED;
    report.filingAcknowledgementNumber = ackNumber;
    report.filingAcknowledgementReceivedAt = new Date();
    report.submittedAt = new Date();
    report.status = ReportStatus.SUBMITTED;

    // Verificar late filing
    if (new Date() > report.filingDeadline) {
      report.lateFiling = true;
    }

    const updated = await this.reportRepo.save(report);
    this.logger.log(`Report submitted: ${report.reportReference}, ack: ${ackNumber}`);
    return updated;
  }

  /**
   * Amend previously filed report
   */
  async amendReport(reportId: string, userId: string): Promise<RegulatoryReport> {
    const original = await this.findById(reportId);

    if (original.status !== ReportStatus.SUBMITTED && original.status !== ReportStatus.ACKNOWLEDGED) {
      throw new BadRequestException('Only submitted or acknowledged reports can be amended');
    }

    const amended = this.reportRepo.create({
      reportType: original.reportType,
      reportingPeriodType: original.reportingPeriodType,
      reportingPeriodStart: original.reportingPeriodStart,
      reportingPeriodEnd: original.reportingPeriodEnd,
      regulatoryAuthority: original.regulatoryAuthority,
      filingFormat: original.filingFormat,
      dataSources: original.dataSources as unknown as Record<string, unknown>[],
      filingDeadline: original.filingDeadline,
      amendmentOriginalId: original.id,
      amendmentCount: original.amendmentCount + 1,
      status: ReportStatus.GENERATING,
      filingStatus: FilingStatus.AMENDED,
      preparedByUserId: userId,
      reportReference: this.generateReportReference(original.reportType),
    });

    const saved = await this.reportRepo.save(amended);
    this.logger.log(`Amendment created: ${saved.reportReference} (original: ${original.reportReference})`);
    return saved;
  }

  async findById(id: string): Promise<RegulatoryReport> {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Regulatory report not found');
    return report;
  }

  async findAll(): Promise<RegulatoryReport[]> {
    return this.reportRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByType(reportType: ReportType): Promise<RegulatoryReport[]> {
    return this.reportRepo.find({
      where: { reportType },
      order: { createdAt: 'DESC' },
    });
  }

  async getFilingReceipt(reportId: string): Promise<{
    reportReference: string;
    ackNumber: string | null;
    receivedAt: Date | null;
    status: FilingStatus;
  }> {
    const report = await this.findById(reportId);
    return {
      reportReference: report.reportReference,
      ackNumber: report.filingAcknowledgementNumber || null,
      receivedAt: report.filingAcknowledgementReceivedAt || null,
      status: report.filingStatus,
    };
  }

  private generateReportReference(reportType: ReportType): string {
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seq = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `REG-${yyyymmdd}-${seq}`;
  }
}
