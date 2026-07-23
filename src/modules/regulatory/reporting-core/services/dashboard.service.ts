import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { RegulatoryLineage } from '../entities/regulatory-lineage.entity';
import { ValidationRule } from '../entities/validation-rule.entity';
import { ReportingCalendar } from '../entities/reporting-calendar.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(RegulatoryLineage)
    private lineageRepo: Repository<RegulatoryLineage>,
    
    @InjectRepository(ValidationRule)
    private validationRepo: Repository<ValidationRule>,
    
    @InjectRepository(ReportingCalendar)
    private calendarRepo: Repository<ReportingCalendar>,
  ) {}

  async getExecutiveSummary(): Promise<{
    totalReports: number;
    certifiedReports: number;
    pendingReviews: number;
    activeValidationRules: number;
    upcomingDeadlines: number;
    criticalAlerts: number;
  }> {
    const [totalReports, certifiedReports, pendingReviews, rules, calendarEvents] = await Promise.all([
      this.lineageRepo.count(),
      this.lineageRepo.count({ where: { status: 'certified' } }),
      this.lineageRepo.count({ where: { status: 'review' } }),
      this.validationRepo.count({ where: { status: 'active' } }),
      this.calendarRepo.count({ 
        where: { 
          status: 'pending',
          startTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      totalReports,
      certifiedReports,
      pendingReviews,
      activeValidationRules: rules,
      upcomingDeadlines: calendarEvents,
      criticalAlerts: 0,
    };
  }

  async getReportTrends(days: number = 30): Promise<Array<{
    date: string;
    reportsCreated: number;
    reportsCertified: number;
    reportsFiled: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const allLineages = await this.lineageRepo.find({
      where: { createdAt: MoreThan(startDate) },
      order: { createdAt: 'ASC' },
    });

    const dailyStats = new Map<string, { reportsCreated: number; reportsCertified: number; reportsFiled: number }>();
    
    for (const lineage of allLineages) {
      const dateKey = lineage.createdAt.toISOString().split('T')[0];
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, { reportsCreated: 0, reportsCertified: 0, reportsFiled: 0 });
      }
      
      const stats = dailyStats.get(dateKey);
      if (stats) {
        stats.reportsCreated++;
        if (lineage.status === 'certified') stats.reportsCertified++;
        if (lineage.status === 'filed') stats.reportsFiled++;
      }
    }

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      reportsCreated: stats.reportsCreated,
      reportsCertified: stats.reportsCertified,
      reportsFiled: stats.reportsFiled,
    }));
  }

  async getValidationMetrics(): Promise<{
    totalRules: number;
    rulesByCategory: Record<string, number>;
    recentFailures: Array<{ ruleName: string; triggeredAt: string; result: string }>;
  }> {
    const rules = await this.validationRepo.find();
    
    const rulesByCategory = rules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentFailures = rules
      .filter(r => r.lastResult === 'failure' || r.lastResult === 'error')
      .slice(-10)
      .map(r => ({
        ruleName: r.ruleName,
        triggeredAt: r.lastTriggeredAt?.toISOString() || '',
        result: r.lastResult || 'unknown',
      }));

    return {
      totalRules: rules.length,
      rulesByCategory,
      recentFailures,
    };
  }

  async getCalendarOverview(days: number = 30): Promise<{
    upcomingDeadlines: Array<{
      eventTitle: string;
      eventType: string;
      startTime: string;
      status: string;
      priority: string;
    }>;
    overdueEvents: number;
  }> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [upcoming, overdue] = await Promise.all([
      this.calendarRepo.find({
        where: {
          startTime: MoreThan(now),
          endTime: LessThan(futureDate),
        },
        order: { startTime: 'ASC' },
      }),
      this.calendarRepo.count({
        where: {
          startTime: LessThan(now),
          status: 'pending',
        },
      }),
    ]);

    return {
      upcomingDeadlines: upcoming.map(e => ({
        eventTitle: e.eventTitle,
        eventType: e.eventType,
        startTime: e.startTime.toISOString(),
        status: e.status,
        priority: e.priority,
      })),
      overdueEvents: overdue,
    };
  }
}
