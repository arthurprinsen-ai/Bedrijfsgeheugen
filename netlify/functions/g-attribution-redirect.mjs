import { resolveAttributionRedirect } from '../../lib/content-learning/attribution-redirect.mjs';

function response(status, location = null) {
  const headers = { 'cache-control': 'no-store, max-age=0', 'content-type': 'text/plain; charset=utf-8' };
  if (location) headers.location = location;
  return new Response(location ? '' : status === 404 ? 'Not found' : status === 410 ? 'Gone' : 'Unavailable', { status, headers });
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('ATTRIBUTION_CONFIG_UNAVAILABLE');
  return { url: url.replace(/\/$/, ''), key };
}

async function supabase(path, options = {}) {
  const { url, key } = config();
  return fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function loadLink(key) {
  const query = new URLSearchParams({ key: `eq.${key}`, select: 'key,destination,campaign_key,status,expires_at', limit: '1' });
  const res = await supabase(`/rest/v1/bg_campaign_links?${query.toString()}`);
  if (!res.ok) throw new Error(`ATTRIBUTION_LOOKUP_${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

async function recordClick(event) {
  const eventId = `gclick:${event.attribution_key}:${crypto.randomUUID()}`;
  const res = await supabase('/rest/v1/rpc/bg_growth_ingest_event', {
    method: 'POST',
    body: JSON.stringify({
      p_event: {
        event_id: eventId,
        event_type: 'cta_click',
        canonical: event.destination.split('#')[0],
        attribution_root_key: event.attribution_key,
        source: 'first_party_redirect',
        medium: 'g',
        campaign: event.campaign_key,
        occurred_at: event.occurred_at,
        payload: { redirect: true },
      },
    }),
  });
  if (!res.ok) throw new Error(`ATTRIBUTION_INGEST_${res.status}`);
}

export default async request => {
  if (!['GET', 'HEAD'].includes(request.method)) return response(405);
  const url = new URL(request.url);
  const key = String(url.searchParams.get('key') || '').trim();
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(key)) return response(404);
  try {
    const result = await resolveAttributionRedirect(key, { loadLink, recordClick });
    return response(result.status, result.location);
  } catch (error) {
    console.error('g-attribution-redirect failed', error instanceof Error ? error.message : 'unknown');
    return response(503);
  }
};
