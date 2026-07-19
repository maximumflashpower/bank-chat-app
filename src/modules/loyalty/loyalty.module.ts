import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyProgram } from './entities/loyalty-program.entity';
import { CustomerLoyaltyEnrollment } from './entities/customer-loyalty-enrollment.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';
import { LoyaltyPromotion } from './entities/loyalty-promotion.entity';
import { LoyaltyMerchantPartner } from './entities/loyalty-merchant-partner.entity';
import { LoyaltyRedemptionCatalog } from './entities/loyalty-redemption-catalog.entity';
import { LoyaltyTierConfig } from './entities/loyalty-tier-config.entity';
import { ProgramService } from './services/program.service';
import { EnrollmentService } from './services/enrollment.service';
import { PointTransactionService } from './services/point-transaction.service';
import { PromotionService } from './services/promotion.service';
import { MerchantPartnerService } from './services/merchant-partner.service';
import { RedemptionService } from './services/redemption.service';
import { LoyaltyController } from './controllers/loyalty.controller';
import { RedemptionController } from './controllers/redemption.controller';
import { PromotionController } from './controllers/promotion.controller';
import { PartnerController } from './controllers/partner.controller';
import { SegmentController } from './controllers/segment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyProgram,
      CustomerLoyaltyEnrollment,
      LoyaltyPointTransaction,
      LoyaltyPromotion,
      LoyaltyMerchantPartner,
      LoyaltyRedemptionCatalog,
      LoyaltyTierConfig,
    ]),
  ],
  controllers: [
    LoyaltyController,
    RedemptionController,
    PromotionController,
    PartnerController,
    SegmentController,
  ],
  providers: [
    ProgramService,
    EnrollmentService,
    PointTransactionService,
    PromotionService,
    MerchantPartnerService,
    RedemptionService,
  ],
  exports: [
    ProgramService,
    EnrollmentService,
    PointTransactionService,
    PromotionService,
    MerchantPartnerService,
    RedemptionService,
  ],
})
export class LoyaltyModule {}
