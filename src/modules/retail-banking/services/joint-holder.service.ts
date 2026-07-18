import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetailJointHolder, RelationshipType, AccessLevel, JointHolderStatus } from '../entities/retail-joint-holder.entity';

@Injectable()
export class JointHolderService {
  private readonly logger = new Logger(JointHolderService.name);

  constructor(
    @InjectRepository(RetailJointHolder)
    private readonly repo: Repository<RetailJointHolder>,
  ) {}

  async addJointHolder(data: Partial<RetailJointHolder>): Promise<RetailJointHolder> {
    const holder = this.repo.create({
      ...data,
      ownershipPercentage: data.ownershipPercentage || 100,
      addedAt: new Date(),
      status: JointHolderStatus.ACTIVE,
    });
    const saved = await this.repo.save(holder);
    this.logger.log(`Joint holder added to account ${saved.accountId}: user=${saved.userId}`);
    return saved;
  }

  async findById(id: string): Promise<RetailJointHolder> {
    const holder = await this.repo.findOne({ where: { id } });
    if (!holder) throw new NotFoundException(`Joint holder ${id} not found`);
    return holder;
  }

  async findByAccount(accountId: string): Promise<RetailJointHolder[]> {
    return this.repo.find({ where: { accountId }, order: { addedAt: 'ASC' } });
  }

  async findByUser(userId: string): Promise<RetailJointHolder[]> {
    return this.repo.find({ where: { userId }, order: { addedAt: 'DESC' } });
  }

  async updateAccessLevel(holderId: string, accessLevel: AccessLevel): Promise<RetailJointHolder> {
    const holder = await this.findById(holderId);
    holder.accessLevel = accessLevel;
    return this.repo.save(holder);
  }

  async updateOwnershipPercentage(holderId: string, percentage: number): Promise<RetailJointHolder> {
    const holder = await this.findById(holderId);
    holder.ownershipPercentage = percentage;
    return this.repo.save(holder);
  }

  async removeHolder(holderId: string, removedBy: string): Promise<void> {
    const holder = await this.findById(holderId);
    holder.status = JointHolderStatus.REMOVED;
    holder.removedAt = new Date();
    await this.repo.save(holder);
    this.logger.log(`Joint holder removed: ${holder.id} from account ${holder.accountId}`);
  }

  async getAccountHoldings(userId: string): Promise<Array<{ accountId: string; relationshipType: RelationshipType; accessLevel: AccessLevel }>> {
    const holdings = await this.findByUser(userId);
    return holdings.map(h => ({ accountId: h.accountId, relationshipType: h.relationshipType, accessLevel: h.accessLevel }));
  }

  async validateAccess(holderId: string, requiredAccess: AccessLevel): Promise<boolean> {
    const holder = await this.findById(holderId);
    if (holder.status !== JointHolderStatus.ACTIVE) return false;
    const accessOrder = { [AccessLevel.VIEW_ONLY]: 1, [AccessLevel.TRANSACT_ONLY]: 2, [AccessLevel.FULL_ACCESS]: 3 };
    return accessOrder[holder.accessLevel] >= accessOrder[requiredAccess];
  }
}
