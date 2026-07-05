/**
 * Bases legales para procesamiento según GDPR Art. 6(1)
 * Correspondiente a función PRIV-CONSENT-001
 */
export enum ConsentLegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGITIMATE_INTEREST = 'legitimate_interest',
  LEGAL_OBLIGATION = 'legal_obligation',
}

/** Requisitos asociados a cada base legal */
export const LEGAL_BASIS_REQUIREMENTS: Record<ConsentLegalBasis, { canRevoke: boolean; retentionPeriod?: string }> = {
  [ConsentLegalBasis.CONSENT]: { canRevoke: true },
  [ConsentLegalBasis.CONTRACT]: { canRevoke: false, retentionPeriod: 'duración contrato + 5 años' },
  [ConsentLegalBasis.LEGITIMATE_INTEREST]: { canRevoke: true, retentionPeriod: '2 años desde último contacto' },
  [ConsentLegalBasis.LEGAL_OBLIGATION]: { canRevoke: false, retentionPeriod: 'según normativa específica' },
};
