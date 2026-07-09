import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycVerification } from '../entities/kyc-verification.entity';
import { DocumentType } from '../entities/document-type.enum';
import { RiskLevel } from '../entities/risk-level.enum';
import { VerificationStatus } from '../entities/verification-status.enum';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycVerification)
    private readonly repo: Repository<KycVerification>,
  ) {}

  /** BBC-KYC-001: Document Upload Identity Passport License ID Card */
  async uploadDocument(userId: string, documentType: DocumentType, documentImageBase64: string): Promise<KycVerification> {
    if (!documentImageBase64 || documentImageBase64.length < 100) {
      throw new BadRequestException('Document image is required');
    }
    const existing = await this.repo.findOne({ where: { userId, verificationStatus: VerificationStatus.PENDING } });
    if (existing) {
      existing.documentType = documentType;
      return this.repo.save(existing);
    }
    const verification = this.repo.create({ userId, documentType });
    return this.repo.save(verification);
  }

  /** BBC-KYC-002: OCR Extraction Automatic Data Field Parse */
  async extractOcrData(verificationId: string): Promise<{ documentNumber: string; documentCountry: string; confidence: number }> {
    const verification = await this.findOrFail(verificationId);
    // Stub: simulated OCR extraction
    const documentNumber = 'OCR' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const documentCountry = 'MX';
    const confidence = 92.5;
    verification.documentNumber = documentNumber;
    verification.documentCountry = documentCountry;
    verification.ocrConfidence = confidence;
    await this.repo.save(verification);
    this.logger.log(`OCR extracted for verification ${verificationId}: confidence=${confidence}%`);
    return { documentNumber, documentCountry, confidence };
  }

  /** BBC-KYC-003: Selfie Verification Match Photo ID Compare */
  async verifySelfie(verificationId: string, selfieImageBase64: string): Promise<{ matchScore: number; passed: boolean }> {
    const verification = await this.findOrFail(verificationId);
    if (!selfieImageBase64 || selfieImageBase64.length < 100) {
      throw new BadRequestException('Selfie image is required');
    }
    // Stub: simulated face match
    const matchScore = 88.5;
    verification.faceMatchScore = matchScore;
    await this.repo.save(verification);
    this.logger.log(`Selfie verification for ${verificationId}: matchScore=${matchScore}%`);
    return { matchScore, passed: matchScore >= 80 };
  }

  /** BBC-KYC-004: Liveness Detection Anti-Spoof Attack Prevention */
  async detectLiveness(verificationId: string, videoFrames: string[]): Promise<{ livenessPassed: boolean; confidence: number }> {
    const verification = await this.findOrFail(verificationId);
    if (!videoFrames || videoFrames.length < 3) {
      throw new BadRequestException('At least 3 video frames required for liveness detection');
    }
    // Stub: simulated liveness check
    const confidence = 95.0;
    const livenessPassed = true;
    verification.livenessPassed = livenessPassed;
    await this.repo.save(verification);
    this.logger.log(`Liveness detection for ${verificationId}: passed=${livenessPassed}, confidence=${confidence}%`);
    return { livenessPassed, confidence };
  }

  /** BBC-KYC-005: Risk Scoring Engine Configurable Jurisdiction Based */
  calculateRiskScore(input: {
    ocrConfidence: number;
    faceMatchScore: number;
    livenessPassed: boolean;
    documentCountry: string;
    isPep: boolean;
    adverseMediaHits: number;
  }): { score: number; level: RiskLevel } {
    let score = 0;
    if (input.ocrConfidence < 80) score += 15;
    if (input.faceMatchScore < 80) score += 20;
    if (!input.livenessPassed) score += 30;
    const highRiskCountries = ['AF', 'IR', 'KP', 'SY', 'SS'];
    if (highRiskCountries.includes(input.documentCountry?.toUpperCase())) score += 40;
    if (input.isPep) score += 25;
    if (input.adverseMediaHits > 0) score += 20 * input.adverseMediaHits;
    score = Math.min(score, 100);
    let level: RiskLevel;
    if (score >= 70) level = RiskLevel.PROHIBITED;
    else if (score >= 50) level = RiskLevel.HIGH;
    else if (score >= 25) level = RiskLevel.MEDIUM;
    else level = RiskLevel.LOW;
    return { score, level };
  }

  /** Helper to apply risk score to a verification */
  async applyRiskScore(verificationId: string): Promise<KycVerification> {
    const verification = await this.findOrFail(verificationId);
    const { score, level } = this.calculateRiskScore({
      ocrConfidence: Number(verification.ocrConfidence) || 0,
      faceMatchScore: Number(verification.faceMatchScore) || 0,
      livenessPassed: verification.livenessPassed,
      documentCountry: verification.documentCountry || '',
      isPep: false,
      adverseMediaHits: 0,
    });
    verification.riskScore = score;
    verification.riskLevel = level;
    if (level === RiskLevel.PROHIBITED) {
      verification.verificationStatus = VerificationStatus.REJECTED;
    } else if (score < 25 && verification.livenessPassed && Number(verification.faceMatchScore) >= 80) {
      verification.verificationStatus = VerificationStatus.VERIFIED;
      verification.verifiedAt = new Date();
    } else {
      verification.verificationStatus = VerificationStatus.REVIEW;
    }
    return this.repo.save(verification);
  }

  /** BBC-KYC-006: Enhanced Due Diligence Manual Review Workflow */
  async requestEnhancedDueDiligence(verificationId: string, reviewerId: string, reason: string): Promise<KycVerification> {
    const verification = await this.findOrFail(verificationId);
    verification.verificationStatus = VerificationStatus.REVIEW;
    verification.reviewedBy = reviewerId;
    verification.riskLevel = RiskLevel.HIGH;
    await this.repo.save(verification);
    this.logger.warn(`EDD requested for ${verificationId} by ${reviewerId}: ${reason}`);
    return verification;
  }

  /** BBC-KYC-007: CDD Periodic Renewal Schedule Automatic Alert */
  async scheduleCddRenewal(userId: string, intervalMonths: number = 12): Promise<{ userId: string; nextRenewalDate: Date; scheduled: boolean }> {
    const nextRenewalDate = new Date();
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + intervalMonths);
    this.logger.log(`CDD renewal scheduled for user ${userId}: next=${nextRenewalDate.toISOString()}`);
    return { userId, nextRenewalDate, scheduled: true };
  }

  /** BBC-KYC-008: Address Verification Utility Bill Bank Statement */
  async verifyAddress(verificationId: string, documentImageBase64: string, documentType: string): Promise<{ verified: boolean; confidence: number }> {
    const verification = await this.findOrFail(verificationId);
    if (!documentImageBase64 || documentImageBase64.length < 100) {
      throw new BadRequestException('Address document image is required');
    }
    const validTypes = ['utility_bill', 'bank_statement', 'tax_return'];
    if (!validTypes.includes(documentType)) {
      throw new BadRequestException(`Invalid address document type. Allowed: ${validTypes.join(', ')}`);
    }
    // Stub: simulated address verification
    const confidence = 90.0;
    this.logger.log(`Address verification for ${verificationId}: type=${documentType}, confidence=${confidence}%`);
    return { verified: true, confidence };
  }

  /** BBC-KYC-009: National Registry Cross-Check Government Database */
  async crossCheckNationalRegistry(verificationId: string, nationalId: string): Promise<{ matchFound: boolean; registryData: Record<string, any> | null }> {
    const verification = await this.findOrFail(verificationId);
    if (!nationalId || nationalId.length < 5) {
      throw new BadRequestException('National ID is required');
    }
    // Stub: simulated registry cross-check
    const matchFound = true;
    const registryData = {
      nationalId,
      fullName: 'Registry Match',
      status: 'active',
      verifiedAt: new Date().toISOString(),
    };
    this.logger.log(`National registry cross-check for ${verificationId}: match=${matchFound}`);
    return { matchFound, registryData };
  }

  /** BBC-KYC-010: Biometric Authentication Continuous Verification Session */
  async biometricSessionCheck(userId: string, biometricToken: string): Promise<{ verified: boolean; sessionId: string }> {
    if (!biometricToken || biometricToken.length < 10) {
      throw new BadRequestException('Biometric token is required');
    }
    // Stub: simulated continuous biometric verification
    const sessionId = `BIO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.logger.log(`Biometric session started for user ${userId}: session=${sessionId}`);
    return { verified: true, sessionId };
  }

  /** Get verification status for a user */
  async getStatus(userId: string): Promise<KycVerification | null> {
    return this.repo.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  /** Get risk score for a user */
  async getRiskScore(userId: string): Promise<{ riskScore: number; riskLevel: RiskLevel } | null> {
    const verification = await this.getStatus(userId);
    if (!verification) return null;
    return { riskScore: Number(verification.riskScore), riskLevel: verification.riskLevel };
  }

  /** Find or throw 404 */
  async findOrFail(id: string): Promise<KycVerification> {
    const verification = await this.repo.findOne({ where: { id } });
    if (!verification) throw new NotFoundException(`KYC verification ${id} not found`);
    return verification;
  }
}
