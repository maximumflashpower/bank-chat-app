import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessPayrollBatch, PayrollValidationStatus, PayrollExecutionStatus, PaymentMethod } from '../entities/business-payroll-batch.entity';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectRepository(BusinessPayrollBatch)
    private readonly repo: Repository<BusinessPayrollBatch>,
  ) {}

  async createBatch(data: Partial<BusinessPayrollBatch>): Promise<BusinessPayrollBatch> {
    const batchNumber = this.generateBatchNumber();
    
    const batch = this.repo.create({
      ...data,
      batchNumber,
      validationStatus: PayrollValidationStatus.PENDING,
      executionStatus: PayrollExecutionStatus.PENDING,
    });

    const saved = await this.repo.save(batch);
    this.logger.log(`Payroll batch created: ${batchNumber}, employees=${data.totalEmployees}`);
    return saved;
  }

  async findById(id: string): Promise<BusinessPayrollBatch> {
    const batch = await this.repo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`Payroll batch ${id} not found`);
    return batch;
  }

  async findByAccount(sourceAccountId: string): Promise<BusinessPayrollBatch[]> {
    return this.repo.find({ 
      where: { sourceAccountId },
      order: { effectiveDate: 'DESC' },
    });
  }

  async validateBatch(batchId: string): Promise<BusinessPayrollBatch> {
    const batch = await this.findById(batchId);

    // Validation checks
    if (batch.totalEmployees <= 0) {
      throw new BadRequestException('Invalid employee count');
    }
    if (batch.totalNetAmount <= 0) {
      throw new BadRequestException('Invalid net amount');
    }
    if (batch.effectiveDate <= new Date()) {
      throw new BadRequestException('Effective date must be in the future');
    }

    batch.validationStatus = PayrollValidationStatus.VALIDATED;
    batch.validatedAt = new Date();
    
    const saved = await this.repo.save(batch);
    this.logger.log(`Payroll batch validated: ${batch.batchNumber}`);
    return saved;
  }

  async executeBatch(batchId: string): Promise<BusinessPayrollBatch> {
    const batch = await this.findById(batchId);

    if (batch.validationStatus !== PayrollValidationStatus.VALIDATED) {
      throw new BadRequestException('Batch must be validated before execution');
    }

    batch.executionStatus = PayrollExecutionStatus.EXECUTING;
    await this.repo.save(batch);

    // Placeholder: en producción, enviaría instrucciones de pago a payment engine
    // Para demo, simulamos ejecución exitosa
    setTimeout(async () => {
      const updated = await this.repo.findOne({ where: { id: batchId } });
      if (updated) {
        updated.executionStatus = PayrollExecutionStatus.COMPLETED;
        updated.executedAt = new Date();
        await this.repo.save(updated);
        this.logger.log(`Payroll batch completed: ${batch.batchNumber}`);
      }
    }, 1000);

    this.logger.log(`Payroll batch execution started: ${batch.batchNumber}`);
    return batch;
  }

  async generateNachaFile(batchId: string): Promise<string> {
    const batch = await this.findById(batchId);
    
    // Placeholder: generar formato NACHA real
    return `NACHA FILE - BATCH ${batch.batchNumber}\nTOTAL AMOUNT: ${batch.totalNetAmount}\nEMPLOYEES: ${batch.totalEmployees}`;
  }

  private generateBatchNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `PAY-${date}-${seq}`;
  }

  async cancelBatch(batchId: string): Promise<BusinessPayrollBatch> {
    const batch = await this.findById(batchId);

    if (batch.executionStatus === PayrollExecutionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed batch');
    }

    batch.executionStatus = PayrollExecutionStatus.FAILED;
    return this.repo.save(batch);
  }

  async getBatchReport(batchId: string): Promise<{
    batchNumber: string;
    status: string;
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    taxesWithheld: number;
    deductions: number;
  }> {
    const batch = await this.findById(batchId);
    return {
      batchNumber: batch.batchNumber,
      status: `${batch.validationStatus}/${batch.executionStatus}`,
      totalEmployees: batch.totalEmployees,
      totalGross: Number(batch.totalGrossAmount),
      totalNet: Number(batch.totalNetAmount),
      taxesWithheld: Number(batch.totalTaxesWithheld || 0),
      deductions: Number(batch.totalDeductions || 0),
    };
  }
}
