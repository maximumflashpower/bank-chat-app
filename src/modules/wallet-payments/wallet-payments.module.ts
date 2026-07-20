import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalWalletToken } from './entities/digital-wallet-token.entity.js';
import { PaymentMethodSource } from './entities/payment-method-source.entity.js';
import { PaymentTransactionHub } from './entities/payment-transaction-hub.entity.js';
import { QrPaymentPersonalized } from './entities/qr-payment-personalized.entity.js';
import { PayhubBusinessRule } from './entities/payhub-business-rule.entity.js';
import { CryptoFiatConversion } from './entities/crypto-fiat-conversion.entity.js';
import { WalletService } from './services/wallet.service.js';
import { PaymentMethodService } from './services/payment-method.service.js';
import { PaymentService } from './services/payment.service.js';
import { QrPaymentService } from './services/qr-payment.service.js';
import { PayhubService } from './services/payhub.service.js';
import { CryptoService } from './services/crypto.service.js';
import { ApiIntegrationService } from './services/api-integration.service.js';
import { WalletController } from './controllers/wallet.controller.js';
import { PaymentMethodController } from './controllers/payment-method.controller.js';
import { PaymentController } from './controllers/payment.controller.js';
import { QrCodeController } from './controllers/qr-code.controller.js';
import { PayhubController } from './controllers/payhub.controller.js';
import { ApiIntegrationController } from './controllers/api-integration.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DigitalWalletToken,
      PaymentMethodSource,
      PaymentTransactionHub,
      QrPaymentPersonalized,
      PayhubBusinessRule,
      CryptoFiatConversion,
    ]),
  ],
  providers: [
    WalletService,
    PaymentMethodService,
    PaymentService,
    QrPaymentService,
    PayhubService,
    CryptoService,
    ApiIntegrationService,
  ],
  controllers: [
    WalletController,
    PaymentMethodController,
    PaymentController,
    QrCodeController,
    PayhubController,
    ApiIntegrationController,
  ],
  exports: [
    WalletService,
    PaymentService,
    PayhubService,
    CryptoService,
    ApiIntegrationService,
  ],
})
export class WalletPaymentsModule {}
