export type CountryCode = 'EC' | 'US';

/**
 * Detecta el país en el navegador del cliente basándose en:
 * 1. Parámetro en URL (?country=EC o ?country=US)
 * 2. Preferencia guardada en localStorage / cookie
 * 3. Detección nativa de zona horaria del sistema (Ecuador: America/Guayaquil o Pacific/Galapagos)
 * 4. Fallback por defecto: 'US' (internacional)
 */
export function detectBrowserCountry(): CountryCode {
  if (typeof window === 'undefined') return 'EC';

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('country')?.toUpperCase();
    if (param === 'EC' || param === 'US') return param as CountryCode;

    const saved = localStorage.getItem('sumak-country-v2');
    if (saved === 'EC' || saved === 'US') return saved as CountryCode;

    const match = document.cookie.match(/(?:^|;\s*)sumak-country-v2=([^;]+)/);
    if (match && (match[1] === 'EC' || match[1] === 'US')) {
      return match[1] as CountryCode;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'America/Guayaquil' || tz === 'Pacific/Galapagos') {
      return 'EC';
    }
  } catch {
    // fallback seguro
  }

  return 'US';
}

/** Fallback para compilación estática (build-time) */
export function getCountryCode(_ip?: string, _headers?: Headers): CountryCode {
  return 'EC';
}

