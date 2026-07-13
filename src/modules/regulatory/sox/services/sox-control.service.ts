import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoxControl } from '../entities/sox-control.entity';
import { CreateSoxControlDto } from '../dto/create-sox-control.dto';
import { TestSoxControlDto } from '../dto/test-sox-control.dto';
import { RemediateSoxDeficiencyDto } from '../dto/remediate-sox-deficiency.dto';

@Injectable()
export class SoxControlService {
  private readonly logger = new Logger(SoxControlService.name);

  constructor(
    @InjectRepository(SoxControl)
    private readonly controlRepo: Repository<SoxControl>,
  ) {}

  /**
   * REG-SOX-001: Create SOX control
   */
  async createControl(dto: CreateSoxControlDto): Promise<SoxControl> {
    const existing = await this.controlRepo.findOne({ where: { controlIdRef: dto.controlIdRef } });
    if (existing) {
      throw new BadRequestException(`Control ${dto.controlIdRef} ya existe`);
    }

    const control = Object.assign(new SoxControl(), {
      controlIdRef: dto.controlIdRef,
      controlDescription: dto.controlDescription,
      riskCategory: dto.riskCategory,
      processOwnerId: dto.processOwnerId || null,
      testFrequency: dto.testFrequency,
      testMethod: dto.testMethod,
      lastTestedAt: null,
      lastTestResult: 'not_tested',
      deficiencyCount: 0,
      assertionStatus: 'pending',
      evidenceLink: null,
    });

    const saved = await this.controlRepo.save(control) as unknown as SoxControl;
    this.logger.log(`SOX control created: ${saved.controlIdRef}`);
    return saved;
  }

  /**
   * REG-SOX-001: List all controls with filters
   */
  async findAll(riskCategory?: string, status?: string): Promise<SoxControl[]> {
    const queryBuilder = this.controlRepo.createQueryBuilder('control');

    if (riskCategory) {
      queryBuilder.andWhere('control.riskCategory = :riskCategory', { riskCategory });
    }
    if (status) {
      queryBuilder.andWhere('control.assertionStatus = :status', { status });
    }

    queryBuilder.orderBy('control.controlIdRef', 'ASC');
    return queryBuilder.getMany();
  }

  /**
   * REG-SOX-002: Execute automated test on control
   */
  async executeTest(controlId: string, dto: TestSoxControlDto): Promise<SoxControl> {
    const control = await this.controlRepo.findOne({ where: { id: controlId } });
    if (!control) {
      throw new NotFoundException(`Control ${controlId} no encontrado`);
    }

    control.lastTestedAt = new Date();
    control.lastTestResult = dto.result;
    if (dto.evidenceLink) control.evidenceLink = dto.evidenceLink;

    // Increment deficiency count if failed
    if (dto.result === 'fail') {
      control.deficiencyCount += 1;
      control.assertionStatus = 'deficient';
    } else {
      control.assertionStatus = 'effective';
    }

    const saved = await this.controlRepo.save(control) as unknown as SoxControl;
    this.logger.log(`SOX test executed: ${control.controlIdRef} - result: ${dto.result}`);
    return saved;
  }

  /**
   * REG-SOX-003: Generate deficiency report
   */
  async generateDeficiencyReport(controlId: string): Promise<{ 
    controlId: string; 
    controlName: string;
    failureCount: number;
    lastFailure: Date;
    riskLevel: string;
    recommendedActions: string[];
  }> {
    const control = await this.controlRepo.findOne({ where: { id: controlId } });
    if (!control) {
      throw new NotFoundException(`Control ${controlId} no encontrado`);
    }

    if (control.lastTestResult !== 'fail') {
      throw new BadRequestException('Control no tiene deficiencias registradas');
    }

    const actions = ['Assign remediation owner', 'Define remediation plan', 'Schedule re-test'];
    if (control.deficiencyCount >= 3) {
      actions.push('Escalate to senior management');
    }

    return {
      controlId: control.controlIdRef,
      controlName: control.controlDescription,
      failureCount: control.deficiencyCount,
      lastFailure: control.lastTestedAt || new Date(),
      riskLevel: control.riskCategory,
      recommendedActions: actions,
    };
  }

  /**
   * REG-SOX-004: Generate quarterly assertion package
   */
  async generateQuarterlyAssertion(quarter: string, year: number): Promise<{
    period: string;
    totalControls: number;
    effectiveControls: number;
    deficientControls: number;
    effectivenessRate: number;
    controls: SoxControl[];
  }> {
    const controls = await this.controlRepo.find();
    const effective = controls.filter(c => c.assertionStatus === 'effective').length;
    const deficient = controls.filter(c => c.assertionStatus === 'deficient').length;
    const rate = controls.length ? (effective / controls.length) * 100 : 0;

    return {
      period: `Q${quarter}/${year}`,
      totalControls: controls.length,
      effectiveControls: effective,
      deficientControls: deficient,
      effectivenessRate: Math.round(rate * 100) / 100,
      controls,
    };
  }

  /**
   * REG-SOX-005: Start remediation workflow
   */
  async startRemediation(dto: RemediateSoxDeficiencyDto): Promise<SoxControl> {
    const control = await this.controlRepo.findOne({ where: { id: dto.controlId } });
    if (!control) {
      throw new NotFoundException(`Control ${dto.controlId} no encontrado`);
    }

    if (dto.remediationPlan) {
      control.evidenceLink = dto.remediationPlan;
    }
    if (dto.newStatus) {
      control.assertionStatus = dto.newStatus;
    }

    const saved = await this.controlRepo.save(control) as unknown as SoxControl;
    this.logger.log(`SOX remediation started for: ${control.controlIdRef}`);
    return saved;
  }

  /**
   * REG-SOX-006: Get ITGC controls (subset of all controls)
   */
  async findItgcControls(): Promise<SoxControl[]> {
    return this.controlRepo.find({
      where: { riskCategory: 'IT' },
      order: { controlIdRef: 'ASC' },
    });
  }

  /**
   * REG-SOX-001: Get single control
   */
  async findById(id: string): Promise<SoxControl | null> {
    return this.controlRepo.findOne({ where: { id } });
  }
}
