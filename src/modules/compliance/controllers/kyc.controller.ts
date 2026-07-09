import { Controller, Post, Get, Body, Param, Headers, Logger } from '@nestjs/common';
import { KycService } from '../services/kyc.service';
import { DocumentType } from '../entities/document-type.enum';

@Controller('api/v1/kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

  /** POST /api/v1/kyc/onboard - Iniciar onboarding KYC cliente */
  @Post('onboard')
  async onboard(@Body() body: { userId: string }): Promise<{ verificationId: string; status: string }> {
    const verification = await this.kycService.uploadDocument(body.userId, DocumentType.PASSPORT, '');
    return { verificationId: verification.id, status: verification.verificationStatus };
  }

  /** POST /api/v1/kyc/document/upload - Subir documento identidad */
  @Post('document/upload')
  async uploadDocument(
    @Body() body: { userId: string; documentType: DocumentType; documentImageBase64: string },
  ): Promise<{ verificationId: string; ocrExtractionReady: boolean }> {
    const verification = await this.kycService.uploadDocument(body.userId, body.documentType, body.documentImageBase64);
    return { verificationId: verification.id, ocrExtractionReady: true };
  }

  /** POST /api/v1/kyc/selfie/verify - Verificacion selfie + liveness */
  @Post('selfie/verify')
  async verifySelfie(@Body() body: { verificationId: string; selfieImageBase64: string }): Promise<{ verified: boolean; matchScore: number }> {
    const result = await this.kycService.verifySelfie(body.verificationId, body.selfieImageBase64);
    this.logger.log(`Selfie verified: ${body.verificationId}, score=${result.matchScore}`);
    return { verified: result.passed, matchScore: result.matchScore };
  }

  /** GET /api/v1/kyc/status/{userId} - Status verificacion KYC */
  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string): Promise<any> {
    const status = await this.kycService.getStatus(userId);
    if (!status) return { status: 'not_started' };
    return {
      status: status.verificationStatus,
      riskLevel: status.riskLevel,
      riskScore: Number(status.riskScore),
      verifiedAt: status.verifiedAt,
      documentType: status.documentType,
    };
  }

  /** GET /api/v1/kyc/risk-score/{userId} - Score de riesgo cliente */
  @Get('risk-score/:userId')
  async getRiskScore(@Param('userId') userId: string): Promise<{ riskScore: number; riskLevel: string } | null> {
    return this.kycService.getRiskScore(userId);
  }

  /** POST /api/v1/kyc/edd/request - Solicitar Enhanced Due Diligence */
  @Post('edd/request')
  async requestEdD(@Body() body: { verificationId: string; reviewerId: string; reason: string }): Promise<any> {
    const updated = await this.kycService.requestEnhancedDueDiligence(body.verificationId, body.reviewerId, body.reason);
    return { verificationId: updated.id, status: updated.verificationStatus, eddRequested: true };
  }
}
