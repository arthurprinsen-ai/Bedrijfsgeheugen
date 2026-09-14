const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SHARED_SECRET = Deno.env.get('POWERHOUSE_SHARED_SECRET') || Deno.env.get('POWERHOUSE_TOKEN') || '';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,x-powerhouse-token,authorization',
  'access-control-allow-methods': 'GET,OPTIONS',
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

async function rest(path: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_ENV_MISSING');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`SUPABASE_${res.status}:${await res.text()}`);
  return res.json();
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'GET') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    if (!authorized(req)) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);

    const u = new URL(req.url);
    const today = todayAmsterdam();
    const from = cleanDate(u.searchParams.get('from'), today);
    const to = cleanDate(u.searchParams.get('to'), from);
    if (to < from) throw new Error('INVALID_DATE_RANGE');

    const channel = (u.searchParams.get('channel') || '').trim();
    const tenant = (u.searchParams.get('tenant') || 'bedrijfsgeheugen').trim();
    if (tenant !== 'bedrijfsgeheugen') throw new Error('INVALID_TENANT');
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

    return json({ ok: true, from, to, tenant, channel: channel || null, summary, items });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
