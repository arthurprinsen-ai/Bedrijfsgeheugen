// Mira bronkwaliteit: een bron moet een echte publicatie zijn, geen redirect of zoekpagina.
const BLOCKED_HOSTS = ['google.com', 'google.nl', 'news.google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'facebook.com', 'l.facebook.com', 'lnkd.in', 't.co', 'bit.ly'];

export function classifyMiraSourceUrl(value) {
  let url;
  try { url = new URL(String(value ?? '').trim()); } catch { return { ok: false, reason: 'SOURCE_URL_INVALID' }; }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, reason: 'SOURCE_URL_INVALID' };
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (BLOCKED_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return { ok: false, reason: 'SOURCE_URL_REDIRECT_OR_SEARCH_HOST' };
  if ((/^\/(?:url|search|aclk|imgres)$/i.test(url.pathname) && url.searchParams.has('q')) || url.searchParams.has('url')) {
    return { ok: false, reason: 'SOURCE_URL_REDIRECT_OR_SEARCH_HOST' };
  }
  return { ok: true, reason: null };
}
