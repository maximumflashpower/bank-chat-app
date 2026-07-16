// src/modules/loans/entities/loans.enums.ts

export enum LoanType {
  PERSONAL = 'personal',
  AUTO = 'auto',
  MORTGAGE = 'mortgage',
  STUDENT = 'student',
  COMMERCIAL = 'commercial',
  HELOC = 'heloc',
}

export enum InterestType {
  FIXED = 'fixed',
  VARIABLE = 'variable',
  ARM = 'arm',
  HYBRID = 'hybrid',
}

export enum DecisionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CONDITIONALLY_APPROVED = 'conditionally_approved',
  COUNTEROFFERED = 'counteroffered',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
}

export enum LoanStatus {
  PENDING_DISBURSEMENT = 'pending_disbursement',
  ACTIVE = 'active',
  PAID_OFF = 'paid_off',
  DEFAULTED = 'defaulted',
  CHARGED_OFF = 'charged_off',
  RESTRUCTURED = 'restructured',
  SUSPENDED = 'suspended',
}

export enum DelinquencyStatus {
  CURRENT = 'current',
  DAYS_1_30 = '1-30',
  DAYS_31_60 = '31-60',
  DAYS_61_90 = '61-90',
  DAYS_90_PLUS = '90+',
  DEFAULTED = 'defaulted',
  CHARGED_OFF = 'charged_off',
}

export enum PaymentStatus {
  SCHEDULED = 'scheduled',
  PAID = 'paid',
  PARTIAL = 'partial',
  LATE = 'late',
  MISSED = 'missed',
  SKIPPED = 'skipped',
}

export enum CollateralType {
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  DEPOSIT = 'deposit',
  EQUIPMENT = 'equipment',
  INVENTORY = 'inventory',
  RECEIVABLES = 'receivables',
}

export enum TitleVerificationStatus {
  CLEAR = 'clear',
  PENDING = 'pending',
  HAS_LIENS = 'has_liens',
}

export enum CollateralStatus {
  REGISTERED = 'registered',
  RELEASED = 'released',
  FORECLOSED = 'foreclosed',
  SUBSTITUTED = 'substituted',
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  RETIRED = 'retired',
  UNEMPLOYED = 'unemployed',
}

export enum DelinquencyEventType {
  LATE_PAYMENT = 'late_payment',
  MISSED_PAYMENT = 'missed_payment',
  ENTERED_DELINQUENCY = 'entered_delinquency',
  ESCALATED = 'escalated',
  CURE = 'cure',
  DEFAULT = 'default',
  CHARGE_OFF = 'charge_off',
}

export enum CollectionAction {
  SMS = 'sms',
  EMAIL = 'email',
  CALL = 'call',
  LETTER = 'letter',
  FIELD_VISIT = 'field_visit',
  LEGAL_NOTICE = 'legal_notice',
}

export enum CustomerResponseStatus {
  NO_RESPONSE = 'no_response',
  PROMISED_PAY = 'promised_pay',
  PARTIAL_PAY = 'partial_pay',
  DISPUTE = 'dispute',
  HARDSHIP_REQUEST = 'hardship_request',
}

export enum HardshipProgram {
  FORBEARANCE = 'forbearance',
  MODIFICATION = 'modification',
  REPAYMENT_PLAN = 'repayment_plan',
}

export enum PropertyType {
  SINGLE_FAMILY = 'single_family',
  CONDO = 'condo',
  COMMERCIAL = 'commercial',
  LAND = 'land',
}

export enum ArmAdjustmentFrequency {
  MONTHLY = 'monthly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}
