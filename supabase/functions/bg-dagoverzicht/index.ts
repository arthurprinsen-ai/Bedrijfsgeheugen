import { createClient } from 'npm:@supabase/supabase-js@2';

// Dagoverzicht: commerciële acties + unified content operations from the same authenticated surface.
const TOKEN_HASH = 'aa992cf89d9eeea953e0af4c26b563466d625365af9e6f0fc32e227e6268a170';
const ORIGINS = /^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;

async function sha256(v: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const cors = {
    'access-control-allow-origin': ORIGINS.test(origin) ? origin : 'https://www.bedrijfsgeheugen.nl',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-bg-token',
    'vary': 'origin',
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow',
  };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method === 'GET') return json({ info: 'Het dagoverzicht staat op https://www.bedrijfsgeheugen.nl/intern/vandaag/' });
  if (req.method !== 'POST') return json({ error: 'ALLEEN_POST' }, 405);
  if (origin && !ORIGINS.test(origin)) return json({ error: 'HERKOMST' }, 403);
  if (await sha256(req.headers.get('x-bg-token') || '') !== TOKEN_HASH) return json({ error: 'GEEN_TOEGANG' }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'ONGELDIGE_JSON' }, 400); }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'SERVER_CONFIG' }, 500);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body?.actie === 'lijst') {
    const { data, error } = await client.from('bg_vandaag').select('*').limit(40);
    if (error) return json({ error: 'LEZEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);
    return json({ items: data ?? [] });
  }

  if (body?.actie === 'content') {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const requestedDate = String(body?.datum || today);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return json({ error: 'ONGELDIGE_DATUM' }, 400);

    const { data, error } = await client
      .from('content_operations_cockpit')
      .select('*')
      .eq('tenant_id', 'canonical')
      .eq('publication_date', requestedDate)
      .order('channel', { ascending: true });
    if (error) return json({ error: 'CONTENT_LEZEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);

    const items = data ?? [];
    return json({
      datum: requestedDate,
      blog_komt: items.some((x: any) => x.channel === 'blog' && !['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)),
      compleet: items.length > 0 && items.every((x: any) => ['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)),
      overdue: items.filter((x: any) => x.is_overdue).length,
      items,
    });
  }

  if (body?.actie === 'uitkomst') {
    const { data, error } = await client.rpc('bg_uitkomst_vastleggen', {
      p_fase: String(body?.fase || 'lead'), p_pagina: null, p_omzet_eur: Number(body?.omzet_eur ?? 0),
      p_bron: 'dagoverzicht', p_attributiesleutel: null, p_eigenaar: null, p_extra: {},
      p_action_id: String(body?.action_id || ''), p_uitkomstsoort: body?.uitkomstsoort ?? null,
    });
    if (error) return json({ error: 'MELDEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);
    return json({ ok: true, resultaat: data });
  }

  return json({ error: 'ONBEKENDE_ACTIE' }, 400);
});
