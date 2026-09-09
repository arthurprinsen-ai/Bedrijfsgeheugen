const ALLOWED_HOSTS = new Set(['bedrijfsgeheugen.nl', 'www.bedrijfsgeheugen.nl']);

function safeDestination(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function resolveAttributionRedirect(key, { loadLink, recordClick, now = new Date() } = {}) {
  if (!key || typeof loadLink !== 'function' || typeof recordClick !== 'function') {
    return { status: 404, location: null, cacheControl: 'no-store' };
  }
  const link = await loadLink(String(key));
  if (!link) return { status: 404, location: null, cacheControl: 'no-store' };
  const expired = link.expires_at && new Date(link.expires_at) <= now;
  const destination = safeDestination(link.destination);
  if (link.status !== 'active' || expired || !destination) {
    return { status: 410, location: null, cacheControl: 'no-store' };
  }
  await recordClick({
    attribution_key: String(key),
    campaign_key: link.campaign_key ?? null,
    destination,
    occurred_at: now.toISOString(),
  });
  return { status: 302, location: destination, cacheControl: 'no-store' };
}

export { safeDestination };
