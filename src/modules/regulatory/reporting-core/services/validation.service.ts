import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationRule } from '../entities/validation-rule.entity';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectRepository(ValidationRule)
    private validationRepo: Repository<ValidationRule>,
  ) {}

  async createRule(
    ruleName: string,
    description: string,
    category: 'referential' | 'consistency' | 'cross-tabular' | 'range' | 'format' | 'completeness',
    condition: Record<string, unknown>,
    userId: string,
    options?: {
      severity?: 'info' | 'warning' | 'critical' | 'blocking';
      expectedValues?: Record<string, unknown>;
      errorMessages?: Record<string, string>;
      affectedReports?: string[];
      affectedTables?: string[];
      affectedColumns?: Array<{ table: string; column: string }>;
    },
  ): Promise<ValidationRule> {
    const rule = this.validationRepo.create({
      ruleName,
      description,
      category,
      condition,
      severity: options?.severity || 'warning',
      expectedValues: options?.expectedValues,
      errorMessages: options?.errorMessages,
      affectedReports: options?.affectedReports,
      affectedTables: options?.affectedTables,
      affectedColumns: options?.affectedColumns,
      createdBy: userId,
    });

    const saved = await this.validationRepo.save(rule);
    this.logger.log(`Validation rule created: ${saved.id} — ${ruleName}`);
    return saved;
  }

  async findById(id: string): Promise<ValidationRule> {
    const rule = await this.validationRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Validation rule ${id} not found`);
    return rule;
  }

  async findByCategory(category: 'referential' | 'consistency' | 'cross-tabular' | 'range' | 'format' | 'completeness'): Promise<ValidationRule[]> {
    return this.validationRepo.find({ where: { category } });
  }

  async findAllActive(): Promise<ValidationRule[]> {
    return this.validationRepo.find({ where: { status: 'active' } });
  }

  async triggerRule(
    ruleId: string,
    result: 'success' | 'failure' | 'warning' | 'error',
    error?: Record<string, unknown>,
  ): Promise<ValidationRule> {
    const rule = await this.findById(ruleId);
    rule.lastTriggeredAt = new Date();
    rule.triggerCount += 1;
    rule.lastResult = result;
    rule.lastValidationError = error ?? undefined;
    return this.validationRepo.save(rule);
  }

  async deactivateRule(ruleId: string): Promise<ValidationRule> {
    const rule = await this.findById(ruleId);
    rule.status = 'inactive';
    return this.validationRepo.save(rule);
  }

  async activateRule(ruleId: string): Promise<ValidationRule> {
    const rule = await this.findById(ruleId);
    rule.status = 'active';
    return this.validationRepo.save(rule);
  }

  async executeValidationSuite(reportIds: string[]): Promise<Array<{
    ruleId: string;
    ruleName: string;
    passed: boolean;
    errorMessage?: string;
    severity: string;
  }>> {
    const rules = await this.validationRepo.find({ where: { status: 'active' } });
    
    const results: Array<{
      ruleId: string;
      ruleName: string;
      passed: boolean;
      errorMessage?: string;
      severity: string;
    }> = [];

    for (const rule of rules) {
      const passed = true; // Placeholder - lógica real evaluaría condition contra datos
      
      results.push({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        passed,
        errorMessage: passed ? undefined : rule.errorMessages?.[reportIds[0]],
        severity: rule.severity,
      });
    }

    return results;
  }

  async getValidationReport(reportId: string): Promise<{
    reportId: string;
    totalRules: number;
    passedRules: number;
    failedRules: number;
    blockingErrors: number;
    warnings: number;
    failures: Array<{ ruleId: string; ruleName: string; errorMessage: string }>;
  }> {
    const rules = await this.validationRepo.find({ where: { status: 'active' } });
    const results = await this.executeValidationSuite([reportId]);
    
    const failures = results.filter(r => !r.passed);
    const blockingErrors = failures.filter(f => {
      const rule = rules.find(r => r.id === f.ruleId);
      return rule?.severity === 'blocking' || rule?.severity === 'critical';
    }).length;
    const warnings = failures.filter(f => {
      const rule = rules.find(r => r.id === f.ruleId);
      return rule?.severity === 'warning';
    }).length;

    return {
      reportId,
      totalRules: rules.length,
      passedRules: results.filter(r => r.passed).length,
      failedRules: failures.length,
      blockingErrors,
      warnings,
      failures: failures.map(f => {
        const rule = rules.find(r => r.id === f.ruleId);
        return {
          ruleId: f.ruleId,
          ruleName: rule?.ruleName || f.ruleName,
          errorMessage: f.errorMessage || 'Unknown error',
        };
      }),
    };
  }
}
