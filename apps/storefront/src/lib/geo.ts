import geoip from 'geoip-lite';

export function getCountryCode(ip: string | undefined, headers?: Headers): string {
  // 1. Try Cloudflare Country Header
  const cfCountry = headers?.get('cf-ipcountry')?.toUpperCase();
  if (cfCountry === 'EC' || cfCountry === 'US') {
    return cfCountry;
  }
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry === 'EC' ? 'EC' : 'US'; // Default to US if not EC
  }

  // 2. Try to get Real IP from headers
  const realIp = headers?.get('x-forwarded-for')?.split(',')[0].trim() || headers?.get('x-real-ip');
  const activeIp = realIp || ip;

  if (!activeIp) return 'US';
  
  // Localhost IPs (IPv4/IPv6) map to US by default for dev, unless we want to mock EC
  if (activeIp === '127.0.0.1' || activeIp === '::1' || activeIp.startsWith('192.168.') || activeIp.startsWith('10.')) {
    return 'US'; // Default to US for local development fallback
  }

  const geo = geoip.lookup(activeIp);
  return geo?.country || 'US';
}
