export enum RegulationType {
  REG_E = 'reg_e',
  REG_Z = 'reg_z',
  REG_CC = 'reg_cc',
  REG_DD = 'reg_dd',
  DODD_FRANK = 'dodd_frank',
}

export enum MonitorStatus {
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  VIOLATION_DETECTED = 'violation_detected',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CaseStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  PENDING_REVIEW = 'pending_review',
  CLOSED_RESOLVED = 'closed_resolved',
  CLOSED_NO_ACTION = 'closed_no_action',
}
