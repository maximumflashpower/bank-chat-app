import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileDeviceSession } from './entities/mobile-device-session.entity';
import { MobileCheckDeposit } from './entities/mobile-check-deposit.entity';
import { MobileP2pTransfer } from './entities/mobile-p2p-transfer.entity';
import { MobileNotificationLog } from './entities/mobile-notification-log.entity';
import { MobileWidgetConfig } from './entities/mobile-widget-config.entity';
import { MobileAtmLocator } from './entities/mobile-atm-locator.entity';
import { MobileAppointment } from './entities/mobile-appointment.entity';
import { MobileQuickAction } from './entities/mobile-quick-action.entity';
import { MobileFeedback } from './entities/mobile-feedback.entity';
import { DashboardService } from './services/dashboard.service';
import { CheckDepositService } from './services/check-deposit.service';
import { P2pService } from './services/p2p.service';
import { DeviceSessionService } from './services/device-session.service';
import { NotificationService } from './services/notification.service';
import { LocationService } from './services/location.service';
import { SpendingInsightService } from './services/spending-insight.service';
import { FeedbackService } from './services/feedback.service';
import { MobileDashboardController } from './controllers/mobile-dashboard.controller';
import { MobileDeviceSessionController } from './controllers/mobile-device-session.controller';
import { MobileCheckDepositController } from './controllers/mobile-check-deposit.controller';
import { MobileP2pController } from './controllers/mobile-p2p.controller';
import { MobileLocationController } from './controllers/mobile-location.controller';
import { MobileMiscController } from './controllers/mobile-misc.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MobileDeviceSession,
      MobileCheckDeposit,
      MobileP2pTransfer,
      MobileNotificationLog,
      MobileWidgetConfig,
      MobileAtmLocator,
      MobileAppointment,
      MobileQuickAction,
      MobileFeedback,
    ]),
  ],
  providers: [
    DashboardService,
    CheckDepositService,
    P2pService,
    DeviceSessionService,
    NotificationService,
    LocationService,
    SpendingInsightService,
    FeedbackService,
  ],
  controllers: [
    MobileDashboardController,
    MobileDeviceSessionController,
    MobileCheckDepositController,
    MobileP2pController,
    MobileLocationController,
    MobileMiscController,
  ],
})
export class MobileBankingModule {}
