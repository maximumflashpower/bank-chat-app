import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConsolidationEntity, OwnershipType } from '../entities/consolidation-entity.entity';

@Injectable()
export class EntityRegistryService {
  private readonly logger = new Logger(EntityRegistryService.name);

  constructor(
    @InjectRepository(ConsolidationEntity)
    private readonly repo: Repository<ConsolidationEntity>,
  ) {}

  async createEntity(data: Partial<ConsolidationEntity>): Promise<ConsolidationEntity> {
    const existing = await this.repo.findOne({ where: { entityCode: data.entityCode } });
    if (existing) throw new BadRequestException(`Entity code ${data.entityCode} already exists`);
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    this.logger.log(`Entity created: ${saved.entityCode} - ${saved.legalName}`);
    return saved;
  }

  async findByCode(code: string): Promise<ConsolidationEntity | null> {
    return this.repo.findOne({ where: { entityCode: code } });
  }

  async findById(id: string): Promise<ConsolidationEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Entity ${id} not found`);
    return entity;
  }

  async findAll(): Promise<ConsolidationEntity[]> {
    return this.repo.find({ order: { consolidationLevel: 'ASC', legalName: 'ASC' } });
  }

  async findChildren(parentId: string): Promise<ConsolidationEntity[]> {
    return this.repo.find({ where: { parentEntityId: parentId } });
  }

  async getEntityTree(parentId?: string): Promise<any[]> {
    const entities = parentId
      ? await this.repo.find({ where: { parentEntityId: parentId } })
      : await this.repo.find({ where: { parentEntityId: IsNull() } });

    const tree = [];
    for (const entity of entities) {
      const children = await this.getEntityTree(entity.id);
      tree.push({ ...entity, children });
    }
    return tree;
  }

  async updateEntity(id: string, data: Partial<ConsolidationEntity>): Promise<ConsolidationEntity> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async deactivateEntity(id: string): Promise<void> {
    const entity = await this.findById(id);
    entity.isActive = false;
    await this.repo.save(entity);
    this.logger.log(`Entity deactivated: ${entity.entityCode}`);
  }

  async getOwnershipChain(entityId: string): Promise<ConsolidationEntity[]> {
    const chain: ConsolidationEntity[] = [];
    let current = await this.findById(entityId);
    chain.push(current);

    while (current.parentEntityId) {
      const parent = await this.findById(current.parentEntityId);
      chain.push(parent);
      current = parent;
    }
    return chain.reverse();
  }

  async calculateEffectiveOwnership(entityId: string): Promise<number> {
    const chain = await this.getOwnershipChain(entityId);
    let effective = 100;
    for (let i = 1; i < chain.length; i++) {
      effective *= (chain[i].ownershipPercentage / 100);
    }
    return Math.round(effective * 100) / 100;
  }

  async getEntitiesByType(type: OwnershipType): Promise<ConsolidationEntity[]> {
    return this.repo.find({ where: { ownershipType: type, isActive: true } });
  }

  async getConsolidationScope(parentEntityId: string): Promise<ConsolidationEntity[]> {
    const scope: ConsolidationEntity[] = [];
    const collect = async (parentId: string) => {
      const children = await this.findChildren(parentId);
      for (const child of children) {
        if (child.ownershipType !== OwnershipType.ASSOCIATE) {
          scope.push(child);
        }
        await collect(child.id);
      }
    };
    await collect(parentEntityId);
    return scope;
  }
}
