import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceClaim, ClaimStatus } from '../entities/insurance-claim.entity';
import { ClaimEvidence } from '../entities/claim-evidence.entity';
import { InsurancePolicy, PolicyStatus } from '../entities/insurance-policy.entity';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { UploadEvidenceDto } from '../dto/upload-evidence.dto';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(InsuranceClaim)
    private claimRepo: Repository<InsuranceClaim>,
    @InjectRepository(ClaimEvidence)
    private evidenceRepo: Repository<ClaimEvidence>,
    @InjectRepository(InsurancePolicy)
    private policyRepo: Repository<InsurancePolicy>,
  ) {}

  async createClaim(dto: CreateClaimDto): Promise<InsuranceClaim> {
    const policy = await this.policyRepo.findOne({ where: { id: dto.policyId } });
    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Policy is not active');
    }

    const claimNumber = `CLM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    const claim = this.claimRepo.create({
      claimNumber,
      policyId: dto.policyId,
      claimType: dto.claimType,
      incidentDate: new Date(dto.incidentDate),
      incidentLocation: dto.incidentLocation || null,
      description: dto.description,
      claimedAmount: dto.claimedAmount,
      currency: dto.currency,
      status: ClaimStatus.SUBMITTED,
    });

    return this.claimRepo.save(claim);
  }

  async findById(id: string): Promise<InsuranceClaim> {
    const claim = await this.claimRepo.findOne({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  async findByPolicy(policyId: string): Promise<InsuranceClaim[]> {
    return this.claimRepo.find({ where: { policyId }, order: { createdAt: 'DESC' } });
  }

  async assignAdjuster(claimId: string, adjusterId: string): Promise<InsuranceClaim> {
    const claim = await this.findById(claimId);
    claim.assignedAdjuster = adjusterId;
    claim.status = ClaimStatus.UNDER_REVIEW;
    return this.claimRepo.save(claim);
  }

  async approveClaim(claimId: string, approvedAmount: number): Promise<InsuranceClaim> {
    const claim = await this.findById(claimId);
    if (claim.status !== ClaimStatus.UNDER_REVIEW) {
      throw new BadRequestException('Claim must be under review to approve');
    }
    claim.approvedAmount = approvedAmount;
    claim.status = ClaimStatus.APPROVED;
    return this.claimRepo.save(claim);
  }

  async rejectClaim(claimId: string, reason: string): Promise<InsuranceClaim> {
    const claim = await this.findById(claimId);
    claim.status = ClaimStatus.REJECTED;
    return this.claimRepo.save(claim);
  }

  async payout(claimId: string, payoutReference: string): Promise<InsuranceClaim> {
    const claim = await this.findById(claimId);
    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException('Claim must be approved before payout');
    }
    claim.status = ClaimStatus.PAID;
    claim.payoutDate = new Date();
    claim.payoutReference = payoutReference;
    return this.claimRepo.save(claim);
  }

  async uploadEvidence(claimId: string, dto: UploadEvidenceDto): Promise<ClaimEvidence> {
    await this.findById(claimId);
    const evidence = this.evidenceRepo.create({
      claimId,
      evidenceType: dto.evidenceType as any,
      filePath: dto.filePath,
      fileHash: dto.fileHash || null,
      fileSizeBytes: dto.fileSizeBytes || null,
      description: dto.description || null,
      uploadedBy: dto.uploadedBy || null,
    });
    return this.evidenceRepo.save(evidence);
  }

  async getEvidence(claimId: string): Promise<ClaimEvidence[]> {
    return this.evidenceRepo.find({ where: { claimId }, order: { createdAt: 'DESC' } });
  }
}
