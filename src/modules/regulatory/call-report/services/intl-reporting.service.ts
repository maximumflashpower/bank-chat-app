import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegulatoryReport } from '../entities/regulatory-report.entity';
import {
  ReportType,
  FilingStatus,
  RegulatoryAuthority,
  SubmissionMethod,
} from '../entities/call-report-status.enum';

@Injectable()
export class IntlReportingService {
  private readonly logger = new Logger(IntlReportingService.name);

  constructor(
    @InjectRepository(RegulatoryReport)
    private readonly reportRepo: Repository<RegulatoryReport>,
  ) {}

  /**
   * REG-FBAR-001: FBAR Foreign Bank Account Report annual filing
   */
  async prepareFbar(
    userId: string,
    accounts: Array<{ accountNumber: string; bankName: string; maxBalance: number; country: string }>,
    reportingYear: number,
  ): Promise<{ fbarReference: string; totalBalance: number; accounts: any[] }> {
    const fbarReference = `FBAR-${reportingYear}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.maxBalance, 0);

    if (totalBalance <= 10000) {
      throw new Error('Total foreign account balance does not exceed FBAR threshold ($10,000)');
    }

    this.logger.log(`FBAR prepared: ${fbarReference}, totalBalance=${totalBalance}`);

    return {
      fbarReference,
      totalBalance,
      accounts,
    };
  }

  /**
   * REG-FATCA-001: FATCA annual reporting to IRS
   */
  async prepareFatca(
    userId: string,
    reportableAccounts: Array<{ tin: string; accountBalance: number; income: number; country: string }>,
    reportingYear: number,
  ): Promise<{ fatcaReference: string; accountCount: number }> {
    const fatcaReference = `FATCA-${reportingYear}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    this.logger.log(`FATCA prepared: ${fatcaReference}, accounts=${reportableAccounts.length}`);

    return {
      fatcaReference,
      accountCount: reportableAccounts.length,
    };
  }

  /**
   * REG-CRS-001: CRS Common Reporting Standard OECD annual filing
   */
  async prepareCrs(
    userId: string,
    reportableAccounts: Array<{ tin: string; accountBalance: number; jurisdiction: string }>,
    reportingYear: number,
  ): Promise<{ crsReference: string; accountCount: number }> {
    const crsReference = `CRS-${reportingYear}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    this.logger.log(`CRS prepared: ${crsReference}, jurisdictions=${new Set(reportableAccounts.map(a => a.jurisdiction)).size}`);

    return {
      crsReference,
      accountCount: reportableAccounts.length,
    };
  }

  async fileWithAuthority(
    reportId: string,
    authority: RegulatoryAuthority,
    submissionMethod: SubmissionMethod,
  ): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    report.filingStatus = FilingStatus.SUBMITTED;
    report.submissionMethod = submissionMethod;
    report.filingAcknowledgementReceivedAt = new Date();

    await this.reportRepo.save(report);

    this.logger.log(`International report filed: ${report.reportReference}, authority=${authority}`);
  }

  async getFilingStatistics(
    year: number,
    reportTypes?: ReportType[],
  ): Promise<{
    fbarsFiled: number;
    fatcasFiled: number;
    crsReportsFiled: number;
    totalAccountsReported: number;
  }> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const qb = this.reportRepo.createQueryBuilder('r').where('r.reportingPeriodStart >= :startDate', { startDate });

    if (endDate) {
      qb.andWhere('r.reportingPeriodEnd <= :endDate', { endDate });
    }

    if (reportTypes && reportTypes.length > 0) {
      qb.andWhere('r.reportType IN (:...reportTypes)', { reportTypes });
    }

    const reports = await qb.getMany();

    return {
      fbarsFiled: reports.filter(r => r.reportType === ReportType.FBAR).length,
      fatcasFiled: reports.filter(r => r.reportType === ReportType.FATCA).length,
      crsReportsFiled: reports.filter(r => r.reportType === ReportType.CRS).length,
      totalAccountsReported: reports.length,
    };
  }
}
