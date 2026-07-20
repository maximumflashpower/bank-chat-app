import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrPaymentPersonalized, QrStatus } from '../entities/qr-payment-personalized.entity.js';

@Injectable()
export class QrPaymentService {
  constructor(
    @InjectRepository(QrPaymentPersonalized)
    private qrRepo: Repository<QrPaymentPersonalized>,
  ) {}

  // QRCODE-VASTA-001: Generate personal QR with VASTA standardized payload
  async generateQr(data: {
    ownerUserId: string;
    linkedAccountId: string;
    fixedAmountOptional?: number;
    merchantInfoJson?: Record<string, unknown>;
    validityMinutes?: number;
  }): Promise<QrPaymentPersonalized> {
    const qr = new QrPaymentPersonalized();
    qr.ownerUserId = data.ownerUserId;
    qr.linkedAccountId = data.linkedAccountId;
    qr.encodedVastaToken = this.generateVastaToken(data.ownerUserId, data.linkedAccountId);
    qr.displayImageUrlSvg = `<svg xmlns="http://www.w3.org/2000/svg">QR-${Date.now()}</svg>`;
    if (data.fixedAmountOptional) qr.fixedAmountOptional = data.fixedAmountOptional;
    if (data.merchantInfoJson) qr.merchantInfoJson = data.merchantInfoJson;
    const now = new Date();
    qr.validityStartTime = now;
    const minutes = data.validityMinutes || 10;
    qr.validityEndTime = new Date(now.getTime() + minutes * 60000);
    qr.status = QrStatus.ACTIVE;
    qr.scanCountTotal = 0;
    qr.successfulScans = 0;
    qr.failedScans = 0;
    return this.qrRepo.save(qr);
  }

  // QRCODE-TIME-001: Check QR validity and auto-expire
  async checkValidity(qrId: string): Promise<{ valid: boolean; reason?: string }> {
    const qr = await this.qrRepo.findOneOrFail({ where: { id: qrId } });
    if (qr.status === QrStatus.REVOKED) return { valid: false, reason: 'revoked' };
    if (qr.status === QrStatus.REUSED) return { valid: false, reason: 'reused' };
    const now = new Date();
    if (qr.validityEndTime && now > qr.validityEndTime) {
      qr.status = QrStatus.EXPIRED;
      await this.qrRepo.save(qr);
      return { valid: false, reason: 'expired' };
    }
    return { valid: true };
  }

  // QRCODE-FIXED-001: QR with fixed amount for specific invoice
  async generateFixedAmountQr(data: {
    ownerUserId: string;
    linkedAccountId: string;
    fixedAmount: number;
    merchantInfoJson?: Record<string, unknown>;
    validityMinutes?: number;
  }): Promise<QrPaymentPersonalized> {
    return this.generateQr({
      ownerUserId: data.ownerUserId,
      linkedAccountId: data.linkedAccountId,
      fixedAmountOptional: data.fixedAmount,
      merchantInfoJson: data.merchantInfoJson,
      validityMinutes: data.validityMinutes,
    });
  }

  // QRCODE-ANONYMITY-001: Mask bank account, only public profile visible
  async getPublicProfile(qrId: string): Promise<{ displayName: string; photoUrl?: string; fixedAmount?: number }> {
    const qr = await this.qrRepo.findOneOrFail({ where: { id: qrId } });
    return {
      displayName: 'Bank Customer',
      fixedAmount: qr.fixedAmountOptional,
    };
  }

  // QRCODE-MERCHANT-001: Merchant info display in QR
  async getMerchantInfo(qrId: string): Promise<Record<string, unknown> | null> {
    const qr = await this.qrRepo.findOneOrFail({ where: { id: qrId } });
    return qr.merchantInfoJson || null;
  }

  // Scan and process QR
  async scanQr(data: {
    qrId: string;
    scannerUserId: string;
    amount?: number;
  }): Promise<{ success: boolean; paymentReference?: string; reason?: string }> {
    const qr = await this.qrRepo.findOneOrFail({ where: { id: data.qrId } });
    const validity = await this.checkValidity(data.qrId);
    if (!validity.valid) {
      qr.failedScans++;
      qr.scanCountTotal++;
      qr.lastScannedAt = new Date();
      await this.qrRepo.save(qr);
      return { success: false, reason: validity.reason };
    }
    // QRCODE-FIXED-001: If QR has fixed amount, use it
    const paymentAmount = data.amount || qr.fixedAmountOptional || 0;
    if (paymentAmount <= 0 && !qr.fixedAmountOptional) {
      qr.failedScans++;
      qr.scanCountTotal++;
      qr.lastScannedAt = new Date();
      await this.qrRepo.save(qr);
      return { success: false, reason: 'no_amount_specified' };
    }
    qr.successfulScans++;
    qr.scanCountTotal++;
    qr.lastScannedAt = new Date();
    await this.qrRepo.save(qr);
    const ref = `QR-PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return { success: true, paymentReference: ref };
  }

  // Revoke QR manually
  async revokeQr(qrId: string): Promise<QrPaymentPersonalized> {
    const qr = await this.qrRepo.findOneOrFail({ where: { id: qrId } });
    qr.status = QrStatus.REVOKED;
    qr.revokedAt = new Date();
    return this.qrRepo.save(qr);
  }

  // List QR codes by owner
  async listByOwner(ownerUserId: string): Promise<QrPaymentPersonalized[]> {
    return this.qrRepo.find({
      where: { ownerUserId },
      order: { createdAt: 'DESC' },
    });
  }

  private generateVastaToken(userId: string, accountId: string): string {
    const payload = `${userId}:${accountId}:${Date.now()}`;
    return Buffer.from(payload).toString('base64url').substring(0, 500);
  }
}
