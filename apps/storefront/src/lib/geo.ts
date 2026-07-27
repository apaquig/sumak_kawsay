import geoip from 'geoip-lite';

export function getCountryCode(ip: string | undefined): string {
  if (!ip) return 'US';
  
  // Localhost IPs (IPv4/IPv6) map to US by default for dev, unless we want to mock EC
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'US'; // Default to US for local development fallback
  }

  const geo = geoip.lookup(ip);
  return geo?.country || 'US';
}
