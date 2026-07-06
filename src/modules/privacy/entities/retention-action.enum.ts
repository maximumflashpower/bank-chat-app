/**
 * Acciones de retención/expiración de datos
 * Funciones PRIV-PBDESIGN-004 y PRIV-PBDESIGN-005
 */
export enum RetentionAction {
  ANONYMIZE = 'anonymize',           // Anonimizar (irreversible, sin clave)
  PSEUDONYMIZE = 'pseudonymize',     // Seudonimizar (reversible con clave)
  SECURE_DELETE = 'secure_delete',   // Borrado seguro permanente
  ARCHIVE = 'archive',               // Archivar a almacenamiento frío
}
