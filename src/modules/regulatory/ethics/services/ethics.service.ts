import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthicsCase } from '../entities/ethics-case.entity';
import { ConflictOfInterest } from '../entities/conflict-of-interest.entity';
import { GiftEntertainmentLog } from '../entities/gift-entertainment-log.entity';
import { SubmitWhistleblowerDto } from '../dto/submit-whistleblower.dto';
import { DeclareCoiDto } from '../dto/declare-coi.dto';
import { LogGiftDto } from '../dto/log-gift.dto';
import { ReviewCoiDto } from '../dto/review-coi.dto';
import { ApproveGiftDto } from '../dto/approve-gift.dto';
import { EthicsCaseType } from '../entities/ethics-case-type.enum';

@Injectable()
export class EthicsService {
  private readonly logger = new Logger(EthicsService.name);

  constructor(
    @InjectRepository(EthicsCase)
    private readonly caseRepo: Repository<EthicsCase>,
    @InjectRepository(ConflictOfInterest)
    private readonly coiRepo: Repository<ConflictOfInterest>,
    @InjectRepository(GiftEntertainmentLog)
    private readonly giftRepo: Repository<GiftEntertainmentLog>,
  ) {}

  // ── WHISTLEBLOWER ──

  /**
   * REG-WB-001: Submit anonymous whistleblower report
   */
  async submitWhistleblower(dto: SubmitWhistleblowerDto): Promise<EthicsCase> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const caseEntity = Object.assign(new EthicsCase(), {
      caseType: dto.caseType,
      anonymousReport: dto.anonymous,
      reporterEncryptedId: dto.encryptedReporterId || null,
      description: dto.description,
      severity: dto.severity || 'medium',
      status: 'open',
      evidenceAttachments: dto.evidenceAttachments || [],
      confidentialityLevel: 'restricted',
      investigationDeadline: deadline,
      rewardEligible: false,
    });

    const saved = await this.caseRepo.save(caseEntity) as unknown as EthicsCase;
    this.logger.log(`Whistleblower case created: ${saved.id} (anonymous: ${dto.anonymous})`);
    return saved;
  }

  /**
   * REG-WB-002: Protect whistleblower identity (blowback prevention)
   */
  async protectIdentity(caseId: string): Promise<{ caseId: string; protected: boolean; message: string }> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    caseEntity.confidentialityLevel = 'restricted';
    await this.caseRepo.save(caseEntity);

    this.logger.log(`Identity protection enforced for case ${caseId}`);
    return {
      caseId,
      protected: true,
      message: 'Identity encrypted and access restricted to authorized investigators only',
    };
  }

  /**
   * REG-WB-003: Track investigation deadline
   */
  async getDeadlineStatus(caseId: string): Promise<{
    caseId: string;
    deadline: Date;
    daysRemaining: number;
    status: string;
    overdue: boolean;
  }> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const now = new Date();
    const deadline = caseEntity.investigationDeadline || new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      caseId,
      deadline,
      daysRemaining,
      status: caseEntity.status,
      overdue: daysRemaining < 0,
    };
  }

  /**
   * REG-WB-004: Assess reward eligibility
   */
  async assessRewardEligibility(caseId: string, assessment: string): Promise<EthicsCase> {
    const caseEntity = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    if (caseEntity.caseType !== 'whistleblower') {
      throw new BadRequestException('Reward eligibility only applies to whistleblower cases');
    }

    caseEntity.rewardEligible = assessment === 'eligible';
    caseEntity.rewardAssessment = assessment;

    const saved = await this.caseRepo.save(caseEntity);
    this.logger.log(`Reward assessment for case ${caseId}: ${assessment}`);
    return saved;
  }

  // ── CONFLICT OF INTEREST ──

  /**
   * REG-COI-001: Submit annual COI declaration
   */
  async declareCoi(dto: DeclareCoiDto): Promise<ConflictOfInterest> {
    const coi = Object.assign(new ConflictOfInterest(), {
      employeeId: dto.employeeId,
      declaration: dto.declaration,
      relatedVendors: dto.relatedVendors || [],
      screeningStatus: 'pending',
      approvalStatus: 'pending',
      declaredAt: new Date(),
    });

    const saved = await this.coiRepo.save(coi) as unknown as ConflictOfInterest;
    this.logger.log(`COI declaration submitted by employee ${dto.employeeId}`);
    return saved;
  }

  /**
   * REG-COI-002: Automated screening against vendor database
   */
  async screenCoiAgainstVendors(coiId: string, vendorDatabase: string[]): Promise<ConflictOfInterest> {
    const coi = await this.coiRepo.findOne({ where: { id: coiId } });
    if (!coi) {
      throw new NotFoundException(`COI ${coiId} not found`);
    }

    const conflicts = coi.relatedVendors.filter(v => vendorDatabase.includes(v));
    coi.screeningStatus = conflicts.length > 0 ? 'flagged' : 'clear';
    if (conflicts.length > 0) {
      coi.mitigationPlan = `Conflicts found with vendors: ${conflicts.join(', ')}`;
    }

    const saved = await this.coiRepo.save(coi);
    this.logger.log(`COI screening for ${coiId}: ${coi.screeningStatus} (${conflicts.length} conflicts)`);
    return saved;
  }

  /**
   * REG-COI-003: Review COI with mitigation plan
   */
  async reviewCoi(dto: ReviewCoiDto): Promise<ConflictOfInterest> {
    const coi = await this.coiRepo.findOne({ where: { id: dto.coiId } });
    if (!coi) {
      throw new NotFoundException(`COI ${dto.coiId} not found`);
    }

    coi.approvalStatus = dto.approvalStatus;
    if (dto.mitigationPlan) coi.mitigationPlan = dto.mitigationPlan;
    coi.reviewedAt = new Date();

    const saved = await this.coiRepo.save(coi);
    this.logger.log(`COI ${dto.coiId} reviewed: ${dto.approvalStatus}`);
    return saved;
  }

  // ── GIFTS & ENTERTAINMENT ──

  /**
   * REG-GIFT-001: Log gift/entertainment with approval workflow
   */
  async logGift(dto: LogGiftDto): Promise<GiftEntertainmentLog> {
    const gift = Object.assign(new GiftEntertainmentLog(), {
      employeeId: dto.employeeId,
      giftType: dto.giftType,
      giftDescription: dto.giftDescription,
      giftValue: dto.giftValue || 0,
      recipientName: dto.recipientName,
      recipientCompany: dto.recipientCompany || null,
      businessPurpose: dto.businessPurpose,
      approvalStatus: 'pending',
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      politicalContribution: dto.politicalContribution || false,
    });

    const saved = await this.giftRepo.save(gift) as unknown as GiftEntertainmentLog;
    this.logger.log(`Gift logged by employee ${dto.employeeId}: ${dto.giftType}`);
    return saved;
  }

  /**
   * REG-GIFT-002: Auto-flag gifts above threshold value
   */
  async flagGiftsAboveThreshold(threshold: number): Promise<GiftEntertainmentLog[]> {
    const allGifts = await this.giftRepo.find({ where: { approvalStatus: 'pending' } });
    const flagged = allGifts.filter(g => g.giftValue > threshold);

    for (const gift of flagged) {
      gift.approvalStatus = 'flagged';
      await this.giftRepo.save(gift);
    }

    this.logger.log(`Flagged ${flagged.length} gifts above threshold ${threshold}`);
    return flagged;
  }

  /**
   * REG-GIFT-003: Generate political contributions report
   */
  async generatePoliticalContributionsReport(): Promise<{
    totalContributions: number;
    totalValue: number;
    contributions: GiftEntertainmentLog[];
  }> {
    const gifts = await this.giftRepo.find({ where: { politicalContribution: true } });
    const totalValue = gifts.reduce((sum, g) => sum + Number(g.giftValue || 0), 0);

    return {
      totalContributions: gifts.length,
      totalValue,
      contributions: gifts,
    };
  }

  // ── HELPERS ──

  async findCasesByType(caseType: string): Promise<EthicsCase[]> {
    return this.caseRepo.find({ where: { caseType }, order: { createdAt: 'DESC' } });
  }

  async findAllCases(): Promise<EthicsCase[]> {
    return this.caseRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findAllCoi(employeeId?: string): Promise<ConflictOfInterest[]> {
    if (employeeId) {
      return this.coiRepo.find({ where: { employeeId }, order: { createdAt: 'DESC' } });
    }
    return this.coiRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findAllGifts(employeeId?: string): Promise<GiftEntertainmentLog[]> {
    if (employeeId) {
      return this.giftRepo.find({ where: { employeeId }, order: { createdAt: 'DESC' } });
    }
    return this.giftRepo.find({ order: { createdAt: 'DESC' } });
  }

  async approveGift(giftId: string, approverId: string, dto: ApproveGiftDto): Promise<GiftEntertainmentLog> {
    const gift = await this.giftRepo.findOne({ where: { id: giftId } });
    if (!gift) {
      throw new NotFoundException(`Gift ${giftId} not found`);
    }

    gift.approvalStatus = dto.approvalStatus;
    gift.approvedBy = approverId;

    const saved = await this.giftRepo.save(gift);
    this.logger.log(`Gift ${giftId} ${dto.approvalStatus} by ${approverId}`);
    return saved;
  }
}
