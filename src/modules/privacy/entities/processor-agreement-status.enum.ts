/**
 * Estados de acuerdo con terceros procesadores
 * Función PRIV-MISC-004
 */
export enum ProcessorAgreementStatus {
  ACTIVE = 'active',
  PENDING_RENEWAL = 'pending_renewal',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}
