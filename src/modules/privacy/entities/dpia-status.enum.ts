/**
 * Estados del workflow DPIA (Data Protection Impact Assessment)
 * Función PRIV-DPIA-001
 */
export enum DpiaStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** Proceso del ciclo de vida DPIA */
export const DPIA_WORKFLOW_STEPS = [
  'Identificación de riesgos potenciales',
  'Análisis de necesidad y proporcionalidad',
  'Evaluación de medidas de mitigación',
  'Consulta al DPO (si aplica)',
  'Aprobación formal',
];
