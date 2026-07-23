export enum ReportType {
  CALL_REPORT_FFIEC_031 = 'ffiec_031',
  CALL_REPORT_FFIEC_041 = 'ffiec_041',
  FBAR = 'fbar',
  FATCA = 'fatca',
  CRS = 'crs',
  HMDA = 'hmda',
  CRA = 'cra',
  PILLAR3 = 'pillar3',
}

export enum ReportingPeriodType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export enum RegulatoryAuthority {
  FFIEC = 'FFIEC',
  FinCEN = 'FinCEN',
  IRS = 'IRS',
  OCC = 'OCC',
  FDIC = 'FDIC',
  FRB = 'FRB',
  SEC = 'SEC',
  OECD = 'OECD',
}

export enum FilingFormat {
  XBRL = 'XBRL',
  XML = 'XML',
  CSV = 'CSV',
  PDF = 'PDF',
  TXT = 'txt',
}

export enum ReportStatus {
  GENERATING = 'generating',
  VALIDATING = 'validating',
  READY = 'ready',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  REJECTED = 'rejected',
  AMENDED = 'amended',
}

export enum FilingStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  REJECTED = 'rejected',
  AMENDED = 'amended',
}

export enum SubmissionMethod {
  API_UPLOAD = 'api_upload',
  PORTAL_MANUAL = 'portal_manual',
  SFTP = 'sftp',
}
