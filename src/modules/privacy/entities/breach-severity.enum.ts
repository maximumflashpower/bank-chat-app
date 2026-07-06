/**
 * Niveles de severidad de brecha de datos según GDPR Art. 33/34
 * Función PRIV-BREACH-002
 */
export enum BreachSeverity {
  LOW = 'low',           // Datos no sensibles, impacto mínimo
  MEDIUM = 'medium',     // Datos personales, impacto moderado
  HIGH = 'high',         // Datos sensibles Art. 9, riesgo para derechos
  CRITICAL = 'critical', // Datos financieros/credentialles, riesgo inminente
}

/** Umbrales de notificación por severidad */
export const BREACH_NOTIFICATION_RULES: Record<BreachSeverity, {
  notifyAuthority: boolean;  // Notificar autoridad supervisora en 72h
  notifyUsers: boolean;      // Notificar a usuarios afectados
  slaHours: number;          // Plazo máximo de notificación
}> = {
  [BreachSeverity.LOW]: { notifyAuthority: false, notifyUsers: false, slaHours: 0 },
  [BreachSeverity.MEDIUM]: { notifyAuthority: true, notifyUsers: false, slaHours: 72 },
  [BreachSeverity.HIGH]: { notifyAuthority: true, notifyUsers: true, slaHours: 72 },
  [BreachSeverity.CRITICAL]: { notifyAuthority: true, notifyUsers: true, slaHours: 24 },
};
