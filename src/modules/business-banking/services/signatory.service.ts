import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSignatory, AuthorizationLevel, SignatoryStatus } from '../entities/business-signatory.entity';

@Injectable()
export class SignatoryService {
  private readonly logger = new Logger(SignatoryService.name);

  constructor(
    @InjectRepository(BusinessSignatory)
    private readonly repo: Repository<BusinessSignatory>,
  ) {}

  async addSignatory(data: Partial<BusinessSignatory>): Promise<BusinessSignatory> {
    const existing = await this.repo.findOne({ 
      where: { accountId: data.accountId!, userId: data.userId! }
    });
    if (existing && existing.status === SignatoryStatus.ACTIVE) {
      throw new BadRequestException('Signatory already exists for this account');
    }

    const signatory = this.repo.create({
      ...data,
      status: SignatoryStatus.ACTIVE,
      addedAt: new Date(),
    });

    const saved = await this.repo.save(signatory);
    this.logger.log(`Signatory added: ${saved.id} to account ${saved.accountId}`);
    return saved;
  }

  async findById(id: string): Promise<BusinessSignatory> {
    const signatory = await this.repo.findOne({ where: { id } });
    if (!signatory) throw new NotFoundException(`Signatory ${id} not found`);
    return signatory;
  }

  async findByAccount(accountId: string): Promise<BusinessSignatory[]> {
    return this.repo.find({ 
      where: { accountId },
      order: { addedAt: 'ASC' },
    });
  }

  async findByUser(userId: string): Promise<BusinessSignatory[]> {
    return this.repo.find({ 
      where: { userId },
      order: { addedAt: 'DESC' },
    });
  }

  async updateAuthorization(id: string, authorizationLevel: AuthorizationLevel): Promise<BusinessSignatory> {
    const signatory = await this.findById(id);
    signatory.authorizationLevel = authorizationLevel;
    return this.repo.save(signatory);
  }

  async setLimits(id: string, individualLimit: number, cosignAbove: number): Promise<BusinessSignatory> {
    const signatory = await this.findById(id);
    signatory.individualLimitAmount = individualLimit;
    signatory.requiresCosignAbove = cosignAbove;
    return this.repo.save(signatory);
  }

  async grantPermissions(id: string, permissions: Partial<BusinessSignatory>): Promise<BusinessSignatory> {
    const signatory = await this.findById(id);
    Object.assign(signatory, permissions);
    return this.repo.save(signatory);
  }

  async removeSignatory(id: string, removedBy: string): Promise<BusinessSignatory> {
    const signatory = await this.findById(id);
    signatory.status = SignatoryStatus.REMOVED;
    signatory.removedAt = new Date();
    return this.repo.save(signatory);
  }

  async validateAuthorization(accountId: string, userId: string, action: string): Promise<boolean> {
    const signatory = await this.repo.findOne({ 
      where: { accountId, userId, status: SignatoryStatus.ACTIVE },
    });
    if (!signatory) return false;

    const requiredPermission: Record<string, keyof BusinessSignatory> = {
      'initiate_wire': 'canInitiateWire',
      'initiate_ach': 'canInitiateAch',
      'approve_wire': 'canApproveWire',
      'approve_ach': 'canApproveAch',
      'manage_signatories': 'canManageSignatories',
    };

    const permissionKey = requiredPermission[action];
    if (!permissionKey) return true;
    
    return !!signatory[permissionKey];
  }

  async requiresDualSignature(amount: number, accountId: string): Promise<{ required: boolean; approvers: string[] }> {
    const signatories = await this.findByAccount(accountId);
    const activeSignatories = signatories.filter(s => s.status === SignatoryStatus.ACTIVE);
    
    const dualRequired = activeSignatories.some(
      s => s.authorizationLevel === AuthorizationLevel.DUAL || 
           (s.requiresCosignAbove && amount >= Number(s.requiresCosignAbove)),
    );

    const approvers = dualRequired 
      ? activeSignatories.filter(s => s.canApproveWire || s.canApproveAch).map(s => s.userId)
      : [];

    return { required: dualRequired, approvers };
  }
}
