const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SHARED_SECRET = Deno.env.get('POWERHOUSE_SHARED_SECRET') || Deno.env.get('POWERHOUSE_TOKEN') || '';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,x-powerhouse-token,authorization',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function cleanDate(raw: string | null, fallback: string) {
  const value = (raw || fallback).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('INVALID_DATE');
  return value;
}

function todayAmsterdam() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}

function authorized(req: Request) {
  if (!SHARED_SECRET) return false;
  const supplied = req.headers.get('x-powerhouse-token') || '';
  return supplied.length > 0 && supplied === SHARED_SECRET;
}

async function rest(path: string, options: { method?: string; body?: unknown } = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_ENV_MISSING');
  const method = options.method || 'GET';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SUPABASE_${res.status}:${text}`);
  return text ? JSON.parse(text) : null;
}

async function getCockpit(req: Request) {
  const u = new URL(req.url);
  const today = todayAmsterdam();
  const from = cleanDate(u.searchParams.get('from'), today);
  const to = cleanDate(u.searchParams.get('to'), from);
  if (to < from) throw new Error('INVALID_DATE_RANGE');
  const channel = (u.searchParams.get('channel') || '').trim();
  const tenant = (u.searchParams.get('tenant') || 'canonical').trim();
  const filters = [
    `tenant_id=eq.${encodeURIComponent(tenant)}`,
    `publication_date=gte.${from}`,
    `publication_date=lte.${to}`,
  ];
  if (channel) filters.push(`channel=eq.${encodeURIComponent(channel)}`);
  const items = await rest(`content_operations_cockpit?${filters.join('&')}&select=*&order=publication_date.asc,channel.asc&limit=500`);
  const summary = {
    total: items.length,
    due: items.filter((x: any) => x.is_due_today).length,
    overdue: items.filter((x: any) => x.is_overdue).length,
    liveProven: items.filter((x: any) => ['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)).length,
    blocked: items.filter((x: any) => ['BLOCKED','FAILED'].includes(x.status)).length,
    blogComing: items.some((x: any) => x.channel === 'blog' && !['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)),
  };
  return { ok: true, from, to, tenant, channel: channel || null, summary, items };
}

async function deliveryContext(body: any) {
  const date = cleanDate(body?.date || null, todayAmsterdam());
  const tenant = String(body?.tenant || 'canonical').trim();
  await rest('rpc/sync_content_publication_obligations', { method: 'POST', body: { p_from: date, p_to: date } });
  const channelFilter = 'in.(linkedin_personal,linkedin_company,instagram)';
  const obligations = await rest(`content_publication_obligations?tenant_id=eq.${encodeURIComponent(tenant)}&publication_date=eq.${date}&channel=${channelFilter}&select=*&order=channel.asc`);
  const artifacts = await rest(`powerhouse_content_artifacts?run_date=eq.${date}&channel=${channelFilter}&select=*&order=channel.asc`);
  return { ok: true, date, tenant, obligations: obligations || [], artifacts: artifacts || [] };
}

async function recordDeliveryState(body: any) {
  const date = cleanDate(body?.date || null, todayAmsterdam());
  const channel = String(body?.channel || '').trim();
  const status = String(body?.status || '').trim();
  if (!['linkedin_personal','linkedin_company','instagram'].includes(channel)) throw new Error('INVALID_SOCIAL_CHANNEL');
  if (!status) throw new Error('STATUS_REQUIRED');
  const result = await rest('rpc/record_content_publication_state', {
    method: 'POST',
    body: {
      p_tenant_id: String(body?.tenant || 'canonical'),
      p_publication_date: date,
      p_channel: channel,
      p_status: status,
      p_content_id: body?.contentId || null,
      p_slug: null,
      p_external_id: body?.externalId || null,
      p_canonical_url: body?.canonicalUrl || null,
      p_evidence: body?.evidence || {},
      p_metrics: body?.metrics || {},
      p_next_action: body?.nextAction || null,
      p_error: body?.error || null,
    },
  });
  return { ok: true, item: Array.isArray(result) ? result[0] || null : result };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!authorized(req)) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
    if (req.method === 'GET') return json(await getCockpit(req));
    if (req.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    let body: any = {};
    try { body = await req.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
    const action = String(body?.action || '').trim();
    if (action === 'delivery_context') return json(await deliveryContext(body));
    if (action === 'record_delivery_state') return json(await recordDeliveryState(body));
    return json({ ok: false, error: 'INVALID_ACTION' }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
