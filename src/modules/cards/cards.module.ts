import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardProduct } from './entities/card-product.entity';
import { CardInstance } from './entities/card-instance.entity';
import { CardTransaction } from './entities/card-transaction.entity';
import { CardControls } from './entities/card-controls.entity';
import { CardToken } from './entities/card-token.entity';
import { CardDispute } from './entities/card-dispute.entity';
import { CardRewards } from './entities/card-rewards.entity';
import { CardBinConfig } from './entities/card-bin-config.entity';
import { CardProductService } from './services/card-product.service';
import { CardService } from './services/card.service';
import { TransactionService } from './services/transaction.service';
import { CardControlsService } from './services/card-controls.service';
import { TokenService } from './services/token.service';
import { DisputeService } from './services/dispute.service';
import { RewardsService } from './services/rewards.service';
import { FraudService } from './services/fraud.service';
import { ProductController } from './controllers/product.controller';
import { CardController } from './controllers/card.controller';
import { TransactionController } from './controllers/transaction.controller';
import { ControlsController } from './controllers/controls.controller';
import { TokenController } from './controllers/token.controller';
import { DisputeController } from './controllers/dispute.controller';
import { RewardsController } from './controllers/rewards.controller';
import { FraudController } from './controllers/fraud.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CardProduct,
      CardInstance,
      CardTransaction,
      CardControls,
      CardToken,
      CardDispute,
      CardRewards,
      CardBinConfig,
    ]),
  ],
  controllers: [
    ProductController,
    CardController,
    TransactionController,
    ControlsController,
    TokenController,
    DisputeController,
    RewardsController,
    FraudController,
  ],
  providers: [
    CardProductService,
    CardService,
    TransactionService,
    CardControlsService,
    TokenService,
    DisputeService,
    RewardsService,
    FraudService,
  ],
  exports: [
    CardProductService,
    CardService,
    TransactionService,
    CardControlsService,
    TokenService,
    DisputeService,
    RewardsService,
    FraudService,
  ],
})
export class CardsModule {}
