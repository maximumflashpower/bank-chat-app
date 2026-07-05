/**
 * Tipos de solicitud DSAR según derechos GDPR Capítulo III
 * Correspondiente a función PRIV-DSAR-001
 */
export enum DsarRequestType {
  ACCESS = 'access',          // Art. 15 - Derecho de acceso
  ERASURE = 'erasure',        // Art. 17 - Derecho al olvido
  PORTABILITY = 'portability',// Art. 20 - Portabilidad de datos
  RECTIFICATION = 'rectification', // Art. 16 - Rectificación
  OBJECTION = 'objection',    // Art. 21 - Oposición
}

/** Plazos legales por tipo de solicitud */
export const DSAR_DEADLINE_DAYS: Record<DsarRequestType, number> = {
  [DsarRequestType.ACCESS]: 30,
  [DsarRequestType.ERASURE]: 30,
  [DsarRequestType.PORTABILITY]: 30,
  [DsarRequestType.RECTIFICATION]: 30,
  [DsarRequestType.OBJECTION]: 60,  // Más tiempo para evaluación de objeción legítima
};
