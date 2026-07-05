/**
 * Categorías de datos personales según GDPR Recital 75 y Art. 4(1)
 * Función PRIV-ART30-002
 */
export enum DataCategory {
  IDENTIFYING = 'identifying',         // nombre, DNI, pasaporte
  CONTACT_INFO = 'contact_info',       // email, teléfono, dirección
  FINANCIAL = 'financial',             // cuentas bancarias, historial crediticio
  BIOMETRIC = 'biometric',             // huella dactilar, reconocimiento facial
  HEALTH_DATA = 'health_data',         // historial médico, condiciones
  LOCATION_DATA = 'location_data',     // GPS, dirección IP, geolocalización
  BEHAVIORAL = 'behavioral',           // hábitos de navegación, preferencias
  SPECIAL_CATEGORY = 'special_category', // Art. 9GDAP - raza, opinión política, etc.
}

/** Descripción regulatoria de cada categoría */
export const DATA_CATEGORIES_DESCRIPTIONS: Record<DataCategory, string> = {
  [DataCategory.IDENTIFYING]: 'Datos que permiten identificar directamente a una persona física',
  [DataCategory.CONTACT_INFO]: 'Información de contacto para comunicación directa',
  [DataCategory.FINANCIAL]: 'Datos relacionados con situación económica y transacciones',
  [DataCategory.BIOMETRIC]: 'Datos biométricos usados para identificación única',
  [DataCategory.HEALTH_DATA]: 'Datos sobre salud física o mental de la persona',
  [DataCategory.LOCATION_DATA]: 'Datos de posición geográfica y movimiento',
  [DataCategory.BEHAVIORAL]: 'Patrones de comportamiento y preferencias observadas',
  [DataCategory.SPECIAL_CATEGORY]: 'Categorías especiales bajo Art. 9GDAP (requieren protección reforzada)',
};
