import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficialOwner } from '../entities/beneficial-owner.entity';

@Injectable()
export class BeneficialOwnerService {
  private readonly logger = new Logger(BeneficialOwnerService.name);

  constructor(
    @InjectRepository(BeneficialOwner)
    private readonly repo: Repository<BeneficialOwner>,
  ) {}

  /** BBC-BO-001: Beneficial Ownership Discovery Chain Mapping */
  async discoverOwnershipChain(entityId: string): Promise<BeneficialOwner[]> {
    const owners = await this.repo.find({ where: { entityId } });
    this.logger.log(`Ownership chain discovery for entity ${entityId}: ${owners.length} owners found`);
    return owners;
  }

  /** BBC-BO-002: Ultimate Beneficial Owner UBO >25% Rule */
  async identifyUbo(entityId: string, threshold: number = 25): Promise<BeneficialOwner[]> {
    const owners = await this.discoverOwnershipChain(entityId);
    const ubos = owners.filter((o) => Number(o.ownershipPct) >= threshold);
    if (ubos.length === 0) {
      this.logger.log(`No UBOs found for entity ${entityId} at threshold ${threshold}%`);
    } else {
      this.logger.warn(`UBOs identified for entity ${entityId}: ${ubos.map((u) => u.ownerName).join(', ')}`);
    }
    return ubos;
  }

  /** Add a beneficial owner record */
  async addBeneficialOwner(input: {
    entityId: string;
    ownerName: string;
    ownershipPct: number;
    isPep: boolean;
    kycVerified: boolean;
    ownershipChain?: Record<string, any>;
  }): Promise<BeneficialOwner> {
    if (!input.ownerName || input.ownerName.trim().length < 2) {
      throw new BadRequestException('Owner name must be at least 2 characters');
    }
    if (input.ownershipPct < 0 || input.ownershipPct > 100) {
      throw new BadRequestException('Ownership percentage must be between 0 and 100');
    }
    const owner = Object.assign(new BeneficialOwner(), {
      entityId: input.entityId,
      ownerName: input.ownerName,
      ownershipPct: input.ownershipPct,
      isPep: input.isPep,
      kycVerified: input.kycVerified,
      ownershipChain: input.ownershipChain || null,
    });
    return this.repo.save(owner);
  }

  /** Get beneficial owners for an entity */
  async getByEntityId(entityId: string): Promise<BeneficialOwner[]> {
    return this.repo.find({ where: { entityId } });
  }
}
