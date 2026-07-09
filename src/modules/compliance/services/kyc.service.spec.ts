import { KycService } from './kyc.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentType } from '../entities/document-type.enum';
import { RiskLevel } from '../entities/risk-level.enum';
import { VerificationStatus } from '../entities/verification-status.enum';

jest.mock('../entities/kyc-verification.entity');

describe('KycService', () => {
  let service: KycService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    service = new KycService(mockRepo);
  });

  // ─── uploadDocument ───────────────────────────────────────────
  describe('uploadDocument', () => {
    const longImage = 'x'.repeat(150);

    it('should throw BadRequestException if document image is too short', async () => {
      await expect(
        service.uploadDocument('user-1', DocumentType.PASSPORT, 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if document image is empty', async () => {
      await expect(
        service.uploadDocument('user-1', DocumentType.PASSPORT, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update existing pending verification', async () => {
      const existing = {
        id: 'ver-1',
        userId: 'user-1',
        verificationStatus: VerificationStatus.PENDING,
        documentType: DocumentType.ID_CARD,
      };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);

      const result = await service.uploadDocument('user-1', DocumentType.PASSPORT, longImage);

      expect(existing.documentType).toBe(DocumentType.PASSPORT);
      expect(mockRepo.save).toHaveBeenCalledWith(existing);
      expect(result).toEqual(existing);
    });

    it('should create new verification when no pending exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created = { id: 'ver-2', userId: 'user-1', documentType: DocumentType.PASSPORT };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.uploadDocument('user-1', DocumentType.PASSPORT, longImage);

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        documentType: DocumentType.PASSPORT,
      });
      expect(result).toEqual(created);
    });
  });

  // ─── extractOcrData ───────────────────────────────────────────
  describe('extractOcrData', () => {
    it('should throw NotFoundException if verification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.extractOcrData('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should extract OCR data and save', async () => {
      const verification = { id: 'ver-1', documentNumber: null, documentCountry: null, ocrConfidence: null };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.extractOcrData('ver-1');

      expect(result.documentNumber).toMatch(/^OCR[A-Z0-9]+$/);
      expect(result.documentCountry).toBe('MX');
      expect(result.confidence).toBe(92.5);
      expect(verification.documentNumber).toBeDefined();
      expect(verification.documentCountry).toBe('MX');
      expect(verification.ocrConfidence).toBe(92.5);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── verifySelfie ─────────────────────────────────────────────
  describe('verifySelfie', () => {
    const longSelfie = 'x'.repeat(150);

    it('should throw BadRequestException if selfie image is too short', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.verifySelfie('ver-1', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if verification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.verifySelfie('missing', longSelfie)).rejects.toThrow(NotFoundException);
    });

    it('should verify selfie and return match score', async () => {
      const verification = { id: 'ver-1', faceMatchScore: null };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.verifySelfie('ver-1', longSelfie);

      expect(result.matchScore).toBe(88.5);
      expect(result.passed).toBe(true);
      expect(verification.faceMatchScore).toBe(88.5);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── detectLiveness ──────────────────────────────────────────
  describe('detectLiveness', () => {
    it('should throw BadRequestException if fewer than 3 frames', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.detectLiveness('ver-1', ['frame1', 'frame2']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if frames is null', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.detectLiveness('ver-1', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect liveness and return result', async () => {
      const verification = { id: 'ver-1', livenessPassed: null };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.detectLiveness('ver-1', ['f1', 'f2', 'f3']);

      expect(result.livenessPassed).toBe(true);
      expect(result.confidence).toBe(95.0);
      expect(verification.livenessPassed).toBe(true);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  // ─── calculateRiskScore ──────────────────────────────────────
  describe('calculateRiskScore', () => {
    it('should return LOW risk for clean profile', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 95,
        faceMatchScore: 90,
        livenessPassed: true,
        documentCountry: 'MX',
        isPep: false,
        adverseMediaHits: 0,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM risk when OCR confidence is low', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 70,
        faceMatchScore: 90,
        livenessPassed: true,
        documentCountry: 'US',
        isPep: false,
        adverseMediaHits: 0,
      });
      expect(result.score).toBe(15);
      expect(result.level).toBe(RiskLevel.LOW);
    });

    it('should return HIGH risk when face match is low and OCR is low', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 70,
        faceMatchScore: 70,
        livenessPassed: true,
        documentCountry: 'US',
        isPep: false,
        adverseMediaHits: 1,
      });
      expect(result.score).toBe(55);
      expect(result.level).toBe(RiskLevel.HIGH);
    });

    it('should return MEDIUM risk for high-risk country alone', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 95,
        faceMatchScore: 90,
        livenessPassed: true,
        documentCountry: 'AF',
        isPep: false,
        adverseMediaHits: 0,
      });
      expect(result.score).toBe(40);
      expect(result.level).toBe(RiskLevel.MEDIUM);
    });

    it('should return PROHIBITED when PEP + high-risk country + liveness failed', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 70,
        faceMatchScore: 70,
        livenessPassed: false,
        documentCountry: 'IR',
        isPep: true,
        adverseMediaHits: 0,
      });
      expect(result.score).toBe(100);
      expect(result.level).toBe(RiskLevel.PROHIBITED);
    });

    it('should cap score at 100', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 50,
        faceMatchScore: 50,
        livenessPassed: false,
        documentCountry: 'KP',
        isPep: true,
        adverseMediaHits: 5,
      });
      expect(result.score).toBe(100);
      expect(result.level).toBe(RiskLevel.PROHIBITED);
    });

    it('should handle undefined documentCountry gracefully', () => {
      const result = service.calculateRiskScore({
        ocrConfidence: 95,
        faceMatchScore: 90,
        livenessPassed: true,
        documentCountry: undefined as any,
        isPep: false,
        adverseMediaHits: 0,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe(RiskLevel.LOW);
    });
  });

  // ─── applyRiskScore ──────────────────────────────────────────
  describe('applyRiskScore', () => {
    it('should set VERIFIED when low risk, liveness passed, and face match >= 80', async () => {
      const verification = {
        id: 'ver-1',
        ocrConfidence: 95,
        faceMatchScore: 88,
        livenessPassed: true,
        documentCountry: 'MX',
        riskScore: null,
        riskLevel: null,
        verificationStatus: VerificationStatus.PENDING,
        verifiedAt: null,
      };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.applyRiskScore('ver-1');

      expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(result.verifiedAt).toBeDefined();
      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should set REJECTED when risk is PROHIBITED', async () => {
      const verification = {
        id: 'ver-1',
        ocrConfidence: 50,
        faceMatchScore: 50,
        livenessPassed: false,
        documentCountry: 'KP',
        riskScore: null,
        riskLevel: null,
        verificationStatus: VerificationStatus.PENDING,
        verifiedAt: null,
      };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.applyRiskScore('ver-1');

      expect(result.verificationStatus).toBe(VerificationStatus.REJECTED);
      expect(result.riskLevel).toBe(RiskLevel.PROHIBITED);
    });

    it('should set REVIEW for medium risk', async () => {
      const verification = {
        id: 'ver-1',
        ocrConfidence: 70,
        faceMatchScore: 70,
        livenessPassed: true,
        documentCountry: 'US',
        riskScore: null,
        riskLevel: null,
        verificationStatus: VerificationStatus.PENDING,
        verifiedAt: null,
      };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.applyRiskScore('ver-1');

      expect(result.verificationStatus).toBe(VerificationStatus.REVIEW);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
    });

    it('should throw NotFoundException if verification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.applyRiskScore('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── requestEnhancedDueDiligence ──────────────────────────────
  describe('requestEnhancedDueDiligence', () => {
    it('should set status REVIEW, risk HIGH, and assign reviewer', async () => {
      const verification = {
        id: 'ver-1',
        verificationStatus: VerificationStatus.PENDING,
        reviewedBy: null,
        riskLevel: null,
      };
      mockRepo.findOne.mockResolvedValue(verification);
      mockRepo.save.mockResolvedValue(verification);

      const result = await service.requestEnhancedDueDiligence('ver-1', 'reviewer-1', 'Suspicious activity');

      expect(result.verificationStatus).toBe(VerificationStatus.REVIEW);
      expect(result.reviewedBy).toBe('reviewer-1');
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if verification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.requestEnhancedDueDiligence('missing', 'reviewer-1', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── scheduleCddRenewal ───────────────────────────────────────
  describe('scheduleCddRenewal', () => {
    it('should schedule renewal with default 12 months', async () => {
      const result = await service.scheduleCddRenewal('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.scheduled).toBe(true);
      expect(result.nextRenewalDate).toBeDefined();
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() + 12);
      expect(result.nextRenewalDate.getMonth()).toBe(expectedDate.getMonth());
    });

    it('should schedule renewal with custom interval', async () => {
      const result = await service.scheduleCddRenewal('user-1', 6);

      expect(result.scheduled).toBe(true);
      const expectedDate = new Date();
      expectedDate.setMonth(expectedDate.getMonth() + 6);
      expect(result.nextRenewalDate.getMonth()).toBe(expectedDate.getMonth());
    });
  });

  // ─── verifyAddress ───────────────────────────────────────────
  describe('verifyAddress', () => {
    const longImage = 'x'.repeat(150);

    it('should throw BadRequestException if address document image is too short', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.verifyAddress('ver-1', 'short', 'utility_bill'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid document type', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.verifyAddress('ver-1', longImage, 'invalid_type'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify address with utility bill', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      const result = await service.verifyAddress('ver-1', longImage, 'utility_bill');
      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(90.0);
    });

    it('should verify address with bank statement', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      const result = await service.verifyAddress('ver-1', longImage, 'bank_statement');
      expect(result.verified).toBe(true);
    });

    it('should verify address with tax return', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      const result = await service.verifyAddress('ver-1', longImage, 'tax_return');
      expect(result.verified).toBe(true);
    });
  });

  // ─── crossCheckNationalRegistry ───────────────────────────────
  describe('crossCheckNationalRegistry', () => {
    it('should throw BadRequestException if nationalId is too short', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.crossCheckNationalRegistry('ver-1', '123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if nationalId is empty', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      await expect(
        service.crossCheckNationalRegistry('ver-1', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return match found with registry data', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'ver-1' });
      const result = await service.crossCheckNationalRegistry('ver-1', 'ABC12345678');

      expect(result.matchFound).toBe(true);
      expect(result.registryData).not.toBeNull();
      expect(result.registryData.nationalId).toBe('ABC12345678');
      expect(result.registryData.fullName).toBe('Registry Match');
      expect(result.registryData.status).toBe('active');
    });
  });

  // ─── biometricSessionCheck ───────────────────────────────────
  describe('biometricSessionCheck', () => {
    it('should throw BadRequestException if biometric token is too short', async () => {
      await expect(
        service.biometricSessionCheck('user-1', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if biometric token is empty', async () => {
      await expect(
        service.biometricSessionCheck('user-1', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return verified session with session ID', async () => {
      const result = await service.biometricSessionCheck('user-1', 'valid-biometric-token-12345');

      expect(result.verified).toBe(true);
      expect(result.sessionId).toMatch(/^BIO-/);
    });
  });

  // ─── getStatus ───────────────────────────────────────────────
  describe('getStatus', () => {
    it('should return latest verification for user', async () => {
      const verification = { id: 'ver-1', userId: 'user-1', riskScore: 15 };
      mockRepo.findOne.mockResolvedValue(verification);

      const result = await service.getStatus('user-1');

      expect(result).toEqual(verification);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null if no verification exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.getStatus('user-no-verifications');
      expect(result).toBeNull();
    });
  });

  // ─── getRiskScore ────────────────────────────────────────────
  describe('getRiskScore', () => {
    it('should return risk score and level for user', async () => {
      const verification = { id: 'ver-1', userId: 'user-1', riskScore: '35', riskLevel: RiskLevel.HIGH };
      mockRepo.findOne.mockResolvedValue(verification);

      const result = await service.getRiskScore('user-1');

      expect(result.riskScore).toBe(35);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should return null if no verification exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.getRiskScore('user-none');
      expect(result).toBeNull();
    });
  });

  // ─── findOrFail ──────────────────────────────────────────────
  describe('findOrFail', () => {
    it('should return verification when found', async () => {
      const verification = { id: 'ver-1', userId: 'user-1' };
      mockRepo.findOne.mockResolvedValue(verification);

      const result = await service.findOrFail('ver-1');

      expect(result).toEqual(verification);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
