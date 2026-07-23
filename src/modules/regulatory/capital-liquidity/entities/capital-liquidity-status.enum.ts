export enum CapitalRatioType {
  CET1 = 'CET1',
  TIER1 = 'TIER1',
  TOTAL_CAPITAL = 'TOTAL_CAPITAL',
  LEVERAGE = 'LEVERAGE',
  SUPPLEMENTARY_LEVERAGE = 'SUPPLEMENTARY_LEVERAGE',
}

export enum RiskWeightBucket {
  ZERO_PERCENT = '0%',
  TWENTY_PERCENT = '20%',
  FIFTY_PERCENT = '50%',
  ONE_HUNDRED_PERCENT = '100%',
  ONE_HUNDRED_FIFTY_PERCENT = '150%',
}

export enum LiquidityRatioType {
  LCR = 'LCR',
  NSFR = 'NSFR',
  LDR = 'LDR',
  NS_A_TO_ST_LIAB = 'NS_A_TO_ST_LIAB',
}

export enum BufferType {
  CAPITAL_CONSERVATION = 'capital_conservation',
  COUNTERCYCLICAL = 'countercyclical',
  GSIB = 'gsib',
  DSIB = 'dsib',
}

export enum CapitalAdequacyStatus {
  COMPLIANT = 'compliant',
  BUFFER_BREACH = 'buffer_breach',
  MINIMUM_BREACH = 'minimum_breach',
  PCN_BREACH = 'pcn_breach',
}

export enum ICAAPStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPERVISORY_FEEDBACK = 'supervisory_feedback',
}

export enum Pillar3Frequency {
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export enum StressScenarioSeverity {
  BASE = 'base',
  ADVERSE = 'adverse',
  SEVERELY_ADVERSE = 'severely_adverse',
}
