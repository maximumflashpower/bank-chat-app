/**
 * Estados de una alerta de monitoreo
 * Función: MONITOR-RT-007
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
}
