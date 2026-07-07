// Détection de pays via l'en-tête Vercel `x-vercel-ip-country` (ISO 3166-1 alpha-2).

// Les 54 pays d'Afrique + Sahara occidental (EH).
const AFRICAN_COUNTRY_CODES = new Set<string>([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
  'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
  'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
  'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
  'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
  'TN', 'UG', 'ZM', 'ZW', 'EH',
]);

/** Vrai si le code pays ISO alpha-2 correspond à un pays d'Afrique. */
export function isAfricanCountry(code: string | null | undefined): boolean {
  if (!code) return false;
  return AFRICAN_COUNTRY_CODES.has(code.trim().toUpperCase());
}

/** Pays de la requête (en-tête Vercel), en majuscules, ou '' si absent. */
export function requestCountry(request: Request): string {
  return (request.headers.get('x-vercel-ip-country') || '').trim().toUpperCase();
}
