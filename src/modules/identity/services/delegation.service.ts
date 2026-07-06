import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DelegationRule } from '../entities/delegation-rule.entity';
import { DelegationStatus } from '../entities/delegation-status.enum';
import { DelegationRequestDto } from '../dto/delegation-request.dto';
import { DelegationApproveDto } from '../dto/delegation-approve.dto';

@Injectable()
export class DelegationService {
  constructor(
    @InjectRepository(DelegationRule)
    private readonly repo: Repository<DelegationRule>,
  ) {}

  async createDelegation(requesterId: string, dto: DelegationRequestDto): Promise<DelegationRule> {
    const delegation = this.repo.create({
      requesterId,
      ...dto,
      status: DelegationStatus.PENDING,
      approvedAt: null,
      expiredAt: null,
    });
    return this.repo.save(delegation);
  }

  async approveDelegation(dto: DelegationApproveDto): Promise<DelegationRule> {
    await this.repo.update(dto.delegationId, {
      status: dto.approved ? DelegationStatus.APPROVED : DelegationStatus.REJECTED,
      approvedAt: dto.approved ? new Date() : null,
    });
    return this.repo.findOneOrFail({ where: { id: dto.delegationId } });
  }

  async getPendingForApprovers(approverId: string): Promise<DelegationRule[]> {
    const result = await this.repo.createQueryBuilder('d')
      .where('d.approverId = :approverId', { approverId })
      .orWhere(':approverId = ANY(d.escalationPath)', { approverId })
      .getMany();
    return result;
  }

  async escalateDelegation(delegationId: string, nextApproverId: string): Promise<void> {
    await this.repo.update(delegationId, {
      approverId: nextApproverId,
    });
  }

  async expireOldDelegations(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: DelegationStatus.EXPIRED })
      .where("status = :status AND expired_at < NOW()", { status: DelegationStatus.APPROVED })
      .execute();
    return Number(result.affected);
  }
}
