import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { TellerCashDrawer } from './entities/teller-cash-drawer.entity';
import { TellerTransaction } from './entities/teller-transaction.entity';
import { TellerVault } from './entities/teller-vault.entity';
import { TellerVaultMovement } from './entities/teller-vault-movement.entity';
import { TellerNightDeposit } from './entities/teller-night-deposit.entity';
import { TellerSafeDepositBox } from './entities/teller-safe-deposit-box.entity';

// Services
import { TellerService } from './services/teller.service';
import { DrawerManagementService } from './services/drawer-management.service';
import { VaultService } from './services/vault.service';
import { NightDepositService } from './services/night-deposit.service';
import { FXTellerService } from './services/fx-teller.service';
import { SafeDepositService } from './services/safe-deposit.service';

// Controllers
import { TellerController } from './controllers/teller.controller';
import { VaultController } from './controllers/vault.controller';
import { BranchAuxController } from './controllers/branch-aux.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TellerCashDrawer,
      TellerTransaction,
      TellerVault,
      TellerVaultMovement,
      TellerNightDeposit,
      TellerSafeDepositBox,
    ]),
  ],
  controllers: [
    TellerController,
    VaultController,
    BranchAuxController,
  ],
  providers: [
    TellerService,
    DrawerManagementService,
    VaultService,
    NightDepositService,
    FXTellerService,
    SafeDepositService,
  ],
  exports: [
    TellerService,
    DrawerManagementService,
    VaultService,
    NightDepositService,
    FXTellerService,
    SafeDepositService,
  ],
})
export class BranchTellerModule {}
