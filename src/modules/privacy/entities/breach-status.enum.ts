/**
 * Estados del workflow de brecha de datos
 * Función PRIV-BREACH-001
 */
export enum BreachStatus {
  DETECTED = 'detected',         // Brecha detectada automáticamente
  ASSESSED = 'assessed',         // Severidad evaluada
  NOTIFIED_AUTHORITY = 'notified_authority', // Autoridad notificada
  NOTIFIED_USERS = 'notified_users',         // Usuarios notificados
  CONTAINED = 'contained',       // Brecha contenida
  RESOLVED = 'resolved',         // Resuelta
  CLOSED = 'closed',             // Caso cerrado
}

/** Transiciones válidas del workflow de brecha */
export const BREACH_TRANSITIONS: Record<BreachStatus, BreachStatus[]> = {
  [BreachStatus.DETECTED]: [BreachStatus.ASSESSED],
  [BreachStatus.ASSESSED]: [BreachStatus.NOTIFIED_AUTHORITY, BreachStatus.CONTAINED],
  [BreachStatus.NOTIFIED_AUTHORITY]: [BreachStatus.NOTIFIED_USERS, BreachStatus.CONTAINED],
  [BreachStatus.NOTIFIED_USERS]: [BreachStatus.CONTAINED, BreachStatus.RESOLVED],
  [BreachStatus.CONTAINED]: [BreachStatus.RESOLVED],
  [BreachStatus.RESOLVED]: [BreachStatus.CLOSED],
  [BreachStatus.CLOSED]: [],
};
