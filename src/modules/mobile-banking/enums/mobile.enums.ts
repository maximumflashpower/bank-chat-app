export enum DepositStatus {
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  FUNDS_AVAILABLE = 'funds_available',
}

export enum P2pStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  RETURNED = 'returned',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum P2pTransferType {
  INSTANT_INTERNAL = 'instant_internal',
  INSTANT_EXTERNAL = 'instant_external',
  INVITE_PENDING = 'invite_pending',
}

export enum NotificationType {
  TRANSACTION_ALERT = 'transaction_alert',
  BALANCE_LOW = 'balance_low',
  DEPOSIT_RECEIVED = 'deposit_received',
  CARD_TRANSACTION = 'card_transaction',
  P2P_RECEIVED = 'p2p_received',
  STATEMENT_READY = 'statement_ready',
  CD_MATURITY = 'cd_maturity',
  LOAN_DUE = 'loan_due',
  FRAUD_ALERT = 'fraud_alert',
  PROMOTION = 'promotion',
}

export enum PriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum FeedbackStatus {
  OPEN = 'open',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

export enum BiometricType {
  FACE_ID = 'face_id',
  TOUCH_ID = 'touch_id',
  FINGERPRINT = 'fingerprint',
}
