import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { GovPolicy } from '../entities/gov-policy.entity';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';
import { PolicyStatus } from '../entities/policy-status.enum';
import { EnforcementMode } from '../entities/enforcement-mode.enum';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    @InjectRepository(GovPolicy)
    private readonly policyRepo: Repository<GovPolicy>,
  ) {}

  async create(dto: CreatePolicyDto, userId: string): Promise<GovPolicy> {
    const existing = await this.policyRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Policy '${dto.name}' already exists`);
    }

    const policy = this.policyRepo.create({
      ...dto,
      createdBy: userId,
      version: 1,
      status: PolicyStatus.DRAFT,
    });
    const saved = await this.policyRepo.save(policy);
    this.logger.log(`Policy created: ${saved.id} — name: ${saved.name}`);
    return saved;
  }

  async findAll(filter?: {
    domain?: string;
    status?: string;
  }): Promise<GovPolicy[]> {
    const where: any = {};
    if (filter?.domain) where.domain = filter.domain;
    if (filter?.status) where.status = filter.status;
    return this.policyRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<GovPolicy> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<GovPolicy> {
    const policy = await this.findOne(id);
    Object.assign(policy, dto);
    const updated = await this.policyRepo.save(policy);
    this.logger.log(`Policy updated: ${id} — version: ${updated.version}`);
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const policy = await this.findOne(id);
    await this.policyRepo.softRemove(policy);
    this.logger.log(`Policy soft-deleted: ${id}`);
    return { deleted: true };
  }

  async getVersions(id: string): Promise<GovPolicy[]> {
    const policy = await this.findOne(id);
    return this.policyRepo.find({
      where: { name: policy.name },
      order: { version: 'ASC' },
    });
  }

  async rollback(id: string, targetVersion: number): Promise<GovPolicy> {
    const current = await this.findOne(id);
    const target = await this.policyRepo.findOne({
      where: { name: current.name, version: targetVersion },
    });
    if (!target)
      throw new NotFoundException(
        `Version ${targetVersion} of policy ${current.name} not found`,
      );

    const newVersion = current.version + 1;
    const rolled = this.policyRepo.create({
      ...target,
      id: undefined,
      version: newVersion,
      status: PolicyStatus.ACTIVE,
    });
    current.status = PolicyStatus.ARCHIVED;
    await this.policyRepo.save(current);
    const saved = await this.policyRepo.save(rolled);
    this.logger.log(
      `Policy rolled back: ${current.name} to version ${targetVersion} → new version ${newVersion}`,
    );
    return saved;
  }

  async dryRunTest(
    id: string,
    input: Record<string, any>,
  ): Promise<{ result: string; rationale: string }> {
    const policy = await this.findOne(id);
    const evaluation = this.evaluateJsonRules(policy.codeContent, input);
    return {
      result: evaluation.result,
      rationale:
        evaluation.rationale ||
        `Dry-run evaluation of policy '${policy.name}' v${policy.version}`,
    };
  }

  async getActivePolicies(domain?: string): Promise<GovPolicy[]> {
    const where: any = { status: PolicyStatus.ACTIVE };
    if (domain) where.domain = domain;
    return this.policyRepo.find({ where });
  }

  evaluateJsonRules(
    codeContent: string,
    input: Record<string, any>,
  ): { result: string; rationale: string } {
    try {
      const rules = JSON.parse(codeContent);
      if (!rules.conditions || !Array.isArray(rules.conditions)) {
        return { result: 'undefined', rationale: 'No conditions defined' };
      }
      let allMatch = true;
      for (const cond of rules.conditions) {
        const inputValue = input[cond.field];
        const passes = this.compareValues(
          inputValue,
          cond.operator,
          cond.value,
        );
        if (!passes) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return {
          result: rules.action || 'deny',
          rationale: `All conditions matched — action triggered`,
        };
      }
      return { result: 'permit', rationale: 'Conditions not met — permitted' };
    } catch (e) {
      return {
        result: 'undefined',
        rationale: `Failed to parse policy rules: ${e.message}`,
      };
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '==':
        return actual == expected;
      case '!=':
        return actual != expected;
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }
}
