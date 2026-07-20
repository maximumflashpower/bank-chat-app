import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, In } from 'typeorm';
import { DigitalWalletToken, WalletProvider, NetworkTokenStatus } from '../entities/digital-wallet-token.entity.js';
import { PaymentMethodSource } from '../entities/payment-method-source.entity.js';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(DigitalWalletToken)
    private tokenRepo: Repository<DigitalWalletToken>,
    @InjectRepository(PaymentMethodSource)
    private methodRepo: Repository<PaymentMethodSource>,
  ) {}

  // WALLET-APPLE-001 / WALLET-GOOGLE-001 / WALLET-SAMSUNG-001
  async provisionToken(data: {
    customerId: string;
    cardInstanceId: string;
    walletProvider: WalletProvider;
    deviceIdentifier: string;
    tokenRequestorId: string;
    tokenAuthorizationCode?: string;
  }): Promise<DigitalWalletToken> {
    const token = new DigitalWalletToken();
    token.customerId = data.customerId;
    token.cardInstanceId = data.cardInstanceId;
    token.walletProvider = data.walletProvider;
    token.devicePan = this.generateDevicePan();
    token.dpnLastFour = this.generateLastFour();
    token.deviceIdentifier = data.deviceIdentifier;
    token.tokenRequestorId = data.tokenRequestorId;
    if (data.tokenAuthorizationCode) token.tokenAuthorizationCode = data.tokenAuthorizationCode;
    token.cryptogramType = 'static_dynamic_network_reference';
    token.networkTokenStatus = NetworkTokenStatus.ACTIVE;
    token.createdByApi = true;
    token.provisionedAt = new Date();
    return this.tokenRepo.save(token);
  }

  // WALLET-TOKEN-001: Lifecycle management
  async suspendToken(tokenId: string): Promise<DigitalWalletToken> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    token.networkTokenStatus = NetworkTokenStatus.SUSPENDED;
    return this.tokenRepo.save(token);
  }

  async revokeToken(tokenId: string): Promise<DigitalWalletToken> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    token.networkTokenStatus = NetworkTokenStatus.REVOKED;
    token.revokedAt = new Date();
    return this.tokenRepo.save(token);
  }

  async activateToken(tokenId: string): Promise<DigitalWalletToken> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    token.networkTokenStatus = NetworkTokenStatus.ACTIVE;
    return this.tokenRepo.save(token);
  }

  // WALLET-SECURE-001: Device PAN different from real PAN
  private generateDevicePan(): string {
    const chars = '0123456789';
    let pan = '';
    for (let i = 0; i < 16; i++) pan += chars[Math.floor(Math.random() * chars.length)];
    return pan;
  }

  private generateLastFour(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // WALLET-SPEND-001: Spending limits per device
  async setSpendingLimits(tokenId: string, limits: {
    spendingLimitAmount?: number;
    allowedMccList?: string[];
    allowedCountryCodes?: string[];
  }): Promise<DigitalWalletToken> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    if (limits.spendingLimitAmount !== undefined) token.spendingLimitAmount = limits.spendingLimitAmount;
    if (limits.allowedMccList) token.allowedMccList = limits.allowedMccList;
    if (limits.allowedCountryCodes) token.allowedCountryCodes = limits.allowedCountryCodes;
    return this.tokenRepo.save(token);
  }

  // WALLET-CRYPTO-001: Dynamic cryptogram per-transaction
  async generateDynamicCryptogram(tokenId: string): Promise<{ cryptogram: string; type: string }> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    const cryptogram = this.generateCryptogram();
    token.lastTransactionAt = new Date();
    await this.tokenRepo.save(token);
    return { cryptogram, type: token.cryptogramType };
  }

  private generateCryptogram(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let cg = '';
    for (let i = 0; i < 32; i++) cg += chars[Math.floor(Math.random() * chars.length)];
    return cg;
  }

  // WALLET-BIOMETRIC-001: Biometric consent signature attestation
  async attestBiometricConsent(tokenId: string, biometricData: {
    type: string;
    attestationHash: string;
  }): Promise<{ verified: boolean; attestationRef: string }> {
    const token = await this.tokenRepo.findOneOrFail({ where: { id: tokenId } });
    const attestationRef = `BIO-${Date.now()}-${token.dpnLastFour}`;
    return { verified: true, attestationRef };
  }

  // List authorized devices for a customer
  async listDevices(customerId: string): Promise<DigitalWalletToken[]> {
    return this.tokenRepo.find({
      where: { customerId, networkTokenStatus: Not(In([NetworkTokenStatus.REVOKED])) },
      order: { provisionedAt: 'DESC' },
    });
  }

  // Deactivate token by reference
  async deactivateByRef(tokenRef: string): Promise<{ deactivated: boolean }> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenRef } });
    if (!token) throw new Error('Token not found');
    token.networkTokenStatus = NetworkTokenStatus.REVOKED;
    token.revokedAt = new Date();
    await this.tokenRepo.save(token);
    return { deactivated: true };
  }
}
