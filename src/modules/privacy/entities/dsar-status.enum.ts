/**
 * Estados del workflow DSAR conforme a procedimientos regulatorios
 * Correspondiente a función PRIV-DSAR-004
 */
export enum DsarStatus {
  RECEIVED = 'received',       // Solicitud recibida, validación pendiente
  PROCESSING = 'processing',   // Compilación de datos en progreso
  READY = 'ready',            // Paquete listo para entrega
  DELIVERED = 'delivered',    // Datos entregados al solicitante
  CLOSED = 'closed',         // Caso completado oficialmente
  REJECTED = 'rejected',     // Solicitud rechazada (identidad no verificada / exceso de solicitudes)
}

/** Transiciones válidas entre estados */
export const DSAR_TRANSITIONS: Record<DsarStatus, DsarStatus[]> = {
  [DsarStatus.RECEIVED]: [DsarStatus.PROCESSING, DsarStatus.REJECTED],
  [DsarStatus.PROCESSING]: [DsarStatus.READY, DsarStatus.REJECTED],
  [DsarStatus.READY]: [DsarStatus.DELIVERED],
  [DsarStatus.DELIVERED]: [DsarStatus.CLOSED],
  [DsarStatus.CLOSED]: [],
  [DsarStatus.REJECTED]: [],
};
