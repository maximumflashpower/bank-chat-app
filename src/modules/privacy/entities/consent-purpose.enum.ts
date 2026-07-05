/**
 * Propósitos de procesamiento de datos personales según GDPR Art. 6
 * Correspondiente a función PRIV-CONSENT-001
 */
export enum ConsentPurpose {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY = 'third_party',
  ESSENTIAL = 'essential',
}

/** Mapeo de propósito a descripción para UI */
export const PURPOSE_DESCRIPTIONS: Record<ConsentPurpose, string> = {
  [ConsentPurpose.MARKETING]: 'Envío de comunicaciones promocionales y ofertas personalizadas',
  [ConsentPurpose.ANALYTICS]: 'Recopilación de datos de uso para mejorar la experiencia',
  [ConsentPurpose.THIRD_PARTY]: 'Compartición de datos con socios comerciales seleccionados',
  [ConsentPurpose.ESSENTIAL]: 'Datos requeridos para funcionamiento esencial del servicio',
};
