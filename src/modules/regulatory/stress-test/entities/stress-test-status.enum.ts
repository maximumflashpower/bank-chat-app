export enum StressTestStatus {
  CONFIGURED = 'configured',
  RUNNING = 'running',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  SUBMITTED = 'submitted',
}

export enum ScenarioType {
  DFAST = 'dfast',
  CCAR = 'ccar',
  EBA = 'eba',
  INTERNAL = 'internal',
  ICAAP = 'icaap',
  ILAAP = 'ilaap',
}

export enum ScenarioName {
  BASELINE = 'baseline',
  ADVERSE = 'adverse',
  SEVERELY_ADVERSE = 'severely_adverse',
  CUSTOM = 'custom',
}
