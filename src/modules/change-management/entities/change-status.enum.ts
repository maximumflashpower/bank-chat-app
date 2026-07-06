/**
 * Estados de un change request
 * Función: CHG-MGMT-001
 */
export enum ChangeStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  ROLLED_BACK = 'rolled_back',
}
