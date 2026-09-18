// Centrale Notion sync v10: mediakalender -> Powerhouse + canonical Powerhouse dagselectie -> Notion Dagplan.
// Dagplan parity contract: deterministic public.bg_vandaag -> exactly one Notion row per action_id for Europe/Amsterdam today.
// Canonical identity: powerhouse_sales_actions:<action_id>. Unknown channels fail closed.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON = 'bg-notion-sync';
const TENANT = 'bedrijfsgeheugen';
const MEDIA_DS = Deno.env.get('NOTION_MEDIA_DATA_SOURCE_ID') || '626e4c3c-cfee-4390-b519-6a910538607d';
const DAGPLAN_DS = Deno.env.get('NOTION_DAGPLAN_DATA_SOURCE_ID') || '3c6b3335-e38b-40c3-aba1-e5bd7196f347';
const NOTION_VERSION = '2025-09-03';
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const FUNNEL: Record<string, string> = { 'Bereik': 'awareness', 'Community': 'awareness', 'Vertrouwen': 'consideration', 'Leads': 'conversion', 'Conversie': 'conversion' };
const clip = (v: unknown, n = 1900) => String(v ?? '').slice(0, n);
const rt = (v: unknown) => ({ rich_text: v ? [{ type: 'text', text: { content: clip(v) } }] : [] });
const title = (v: unknown) => ({ title: [{ type: 'text', text: { content: clip(v, 500) } }] });
const sel = (v: string) => ({ select: { name: v } });
const dateProp = (v: string) => ({ date: { start: v } });
const urlProp = (v: unknown) => ({ url: v ? clip(v, 1900) : null });

function txt(p: any): string | null {
  if (!p) return null;
  switch (p.type) {
    case 'select': return p.select?.name ?? null;
    case 'status': return p.status?.name ?? null;
    case 'multi_select': return (p.multi_select || []).map((x: any) => x.name).join(', ') || null;
    case 'rich_text': return (p.rich_text || []).map((x: any) => x.plain_text).join('').trim() || null;
    case 'title': return (p.title || []).map((x: any) => x.plain_text).join('').trim() || null;
    case 'date': return p.date?.start ?? null;
    default: return null;
  }
}
const num = (p: any): number | null => (p?.type === 'number' && Number.isFinite(p.number) ? p.number : null);
const metrics = (vals: Record<string, number | null>) => { const m: Record<string, number> = {}; for (const [k, v] of Object.entries(vals)) if (v !== null) m[k] = v; return Object.values(m).some(v => v > 0) ? m : null; };

function notionChannel(v: unknown): string {
  const k = String(v ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (k === 'e-mail' || k === 'email') return 'E-mail';
  if (k === 'linkedin_comment' || k === 'linkedin_commentaar' || k === 'linkedin_reactie') return 'LinkedIn commentaar';
  if (k === 'linkedin_dm' || k === 'linkedin_direct_message') return 'LinkedIn DM';
  throw new Error(`DAGPLAN_CHANNEL_UNMAPPED:${clip(v, 100)}`);
}

async function notion(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'notion-version': NOTION_VERSION, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const body: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const klass = r.status === 401 || r.status === 403 || r.status === 404 ? 'NOTION_ACCESS' : `NOTION_${r.status}`;
    throw new Error(`${klass}: ${String(body?.message || '').slice(0, 220)}`);
  }
  return body;
}

async function queryDagplanToday(token: string, today: string) {
  const existing: any[] = [];
  let cursor: string | undefined;
  do {
    const body = await notion(token, `/data_sources/${DAGPLAN_DS}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100, start_cursor: cursor, filter: { and: [
        { property: 'Datum', date: { equals: today } },
        { property: 'Bron', select: { equals: 'Powerhouse' } }
      ] } })
    });
    existing.push(...(body.results || []));
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor && existing.length < 500);
  return existing;
}

async function syncDagplan(db: any, token: string) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const { data: actions, error } = await db.from('bg_vandaag').select('*').order('prioriteit', { ascending: false }).order('action_id', { ascending: true }).limit(40);
  if (error) throw new Error('DAGPLAN_SOURCE: ' + error.message);
  const desiredRaw = actions || [];
  const desiredById = new Map<string, any>();
  for (const row of desiredRaw) {
    const id = String(row.action_id);
    if (!desiredById.has(id)) desiredById.set(id, row);
  }
  const desired = [...desiredById.values()];
  const sourceDuplicates = desiredRaw.length - desired.length;
  const desiredIds = new Set(desired.map((x: any) => String(x.action_id)));
  const existing = await queryDagplanToday(token, today);

  const byId = new Map<string, any[]>();
  for (const p of existing) {
    const id = txt(p.properties?.['Bron-ID']);
    if (!id) continue;
    const arr = byId.get(id) || [];
    arr.push(p);
    byId.set(id, arr);
  }

  let created = 0, updated = 0, archived = 0, deduped = 0;
  for (let i = 0; i < desired.length; i++) {
    const a: any = desired[i];
    const actionId = String(a.action_id);
    const canonicalKey = `powerhouse_sales_actions:${actionId}`;
    const candidates = byId.get(actionId) || [];
    const keeper = candidates.find((p: any) => txt(p.properties?.['Identity Key']) === canonicalKey) || candidates[0];
    const actionTitle = `${clip(a.persoon || 'Onbekend', 160)} — ${clip(a.soort || 'actie', 160)}`;
    const props: any = {
      'Actie': title(actionTitle),
      'Datum': dateProp(today),
      'Bron': sel('Powerhouse'),
      'Bron-ID': rt(actionId),
      'Duplicaatsleutel': rt(canonicalKey),
      'Identity Key': rt(canonicalKey),
      'Persoon': rt(a.persoon),
      'Bedrijf': rt(a.bedrijf),
      'Functie': rt(a.rol),
      'Kanaal': sel(notionChannel(a.kanaal)),
      'Prioriteit': sel('P1 — vandaag'),
      'Volgorde': { number: i + 1 },
      'Hoe — stap voor stap': rt(a.tekst_om_te_versturen),
      'Tekst om te versturen': rt(a.tekst_om_te_versturen),
      'Beslisreden': rt(a.waarom),
      'Waarom nu': rt(a.waarom),
      'Waar': urlProp(a.link || a.persoonlijke_link),
      'Profiel-URL': urlProp(a.link),
      'Kwaliteitsstatus': sel('Klaar voor actie'),
      'Experimentvariant': rt('powerhouse-dagplan-parity-v2'),
      'Radar Coverage State': sel('LIVE'),
      'Klaar': { checkbox: false },
      'Verwerkt': { checkbox: false }
    };
    if (keeper) {
      await notion(token, `/pages/${keeper.id}`, { method: 'PATCH', body: JSON.stringify({ properties: props, archived: false }) });
      updated++;
      for (const duplicate of candidates) {
        if (duplicate.id === keeper.id) continue;
        await notion(token, `/pages/${duplicate.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
        archived++; deduped++;
      }
    } else {
      await notion(token, '/pages', { method: 'POST', body: JSON.stringify({ parent: { type: 'data_source_id', data_source_id: DAGPLAN_DS }, properties: props }) });
      created++;
    }
  }

  for (const p of existing) {
    const id = txt(p.properties?.['Bron-ID']);
    if (!id || !desiredIds.has(id)) {
      await notion(token, `/pages/${p.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
      archived++;
    }
  }

  let finalRows: any[] = [];
  let finalIds: string[] = [];
  let uniqueIds = new Set<string>();
  let duplicateIds: string[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    finalRows = await queryDagplanToday(token, today);
    finalIds = finalRows.map((p: any) => txt(p.properties?.['Bron-ID'])).filter(Boolean) as string[];
    uniqueIds = new Set(finalIds);
    duplicateIds = finalIds.filter((id, i) => finalIds.indexOf(id) !== i);
    if (finalRows.length === desired.length && uniqueIds.size === desired.length && duplicateIds.length === 0) break;
    await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
  }
  const channelCounts: Record<string, number> = {};
  for (const p of finalRows) {
    const c = txt(p.properties?.['Kanaal']) || 'NULL';
    channelCounts[c] = (channelCounts[c] || 0) + 1;
  }
  if (finalRows.length !== desired.length || uniqueIds.size !== desired.length || duplicateIds.length) {
    throw new Error(`DAGPLAN_PARITY source=${desiredRaw.length} source_unique=${desired.length} notion=${finalRows.length} unique=${uniqueIds.size} duplicates=${new Set(duplicateIds).size}`);
  }
  return { date: today, source_count: desiredRaw.length, source_unique_count: desired.length, source_duplicates: sourceDuplicates, notion_count: finalRows.length, unique_count: uniqueIds.size, created, updated, archived, deduped, channel_counts: channelCounts, parity: true };
}

async function syncMedia(db: any, token: string) {
  const pages: any[] = []; let cursor: string | undefined;
  do {
    const body = await notion(token, `/data_sources/${MEDIA_DS}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100, start_cursor: cursor, filter: { or: [
        { property: 'Post ID LinkedIn', rich_text: { is_not_empty: true } },
        { property: 'Bedrijfspaginapost', rich_text: { is_not_empty: true } },
        { property: 'Post ID Instagram', rich_text: { is_not_empty: true } }
      ] } })
    });
    pages.push(...(body.results || []));
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor && pages.length < 1000);

  let upserted = 0, enriched = 0, snapshots = 0, zonderMeetdatum = 0;
  for (const page of pages) {
    const p = page.properties || {}; const doel = txt(p['Doel']);
    const kenmerken = { hook_type: txt(p['Hook type']), cta_type: txt(p['CTA type']), content_pillar: txt(p['Contentpijler']), format: txt(p['Media type']) || txt(p['Contenttype']), topic: txt(p['Weekthema']) || txt(p['Titel']), audience: txt(p['Doelgroep']), funnel_stage: doel ? (FUNNEL[doel] || null) : null, source_campaign_id: txt(p['Campagne']), updated_at: new Date().toISOString() };
    const published = txt(p['Publicatiedatum']); const gemeten = txt(p['Analytics bijgewerkt']);
    const kanalen = [
      { platform: 'linkedin', id: txt(p['Post ID LinkedIn']), m: metrics({ impressions: num(p['Weergaven']), reach: num(p['Bereik']), likes: num(p['Likes']), comments: num(p['Reacties']), shares: num(p['Delen']), clicks: num(p['Klikken']), saves: num(p['Opslagen']), dms: num(p['DMs']), leads: num(p['Leads']), meetings: num(p['Afspraken']), offers: num(p['Offertes']) }) },
      { platform: 'instagram', id: txt(p['Post ID Instagram']), m: metrics({ impressions: num(p['IG weergaven']), reach: num(p['IG bereik']), likes: num(p['IG likes']), comments: num(p['IG reacties']), saves: num(p['IG opslagen']) }) }
    ];
    for (const k of kanalen) {
      if (!k.id || k.id === 'bezig') continue;
      const postId = `${k.platform}:${k.id}`;
      const { data: existing } = await db.from('social_posts').select('post_id').eq('tenant_id', TENANT).eq('platform', k.platform).eq('external_post_id', k.id).maybeSingle();
      const rowId = existing?.post_id || postId;
      const { error } = await db.from('social_posts').upsert({ tenant_id: TENANT, post_id: rowId, platform: k.platform, external_post_id: k.id, ...(published ? { published_at: published } : {}), ...kenmerken }, { onConflict: 'tenant_id,platform,external_post_id' });
      if (error) throw new Error('UPSERT_POST: ' + error.message); upserted++;
      if (k.m) {
        if (!gemeten) { zonderMeetdatum++; continue; }
        const { error: se } = await db.from('social_metric_snapshots').upsert({ tenant_id: TENANT, snapshot_id: crypto.randomUUID(), post_id: rowId, observed_at: gemeten, source: 'notion', source_event_id: `notion:${rowId}:${gemeten}`, data_quality: 'OBSERVED', metrics: k.m }, { onConflict: 'tenant_id,source_event_id', ignoreDuplicates: true });
        if (se) throw new Error('UPSERT_SNAPSHOT: ' + se.message); snapshots++;
      }
    }
    const bedrijf = txt(p['Bedrijfspaginapost']);
    if (bedrijf && bedrijf !== 'bezig') { const { data } = await db.from('social_posts').update(kenmerken).eq('tenant_id', TENANT).eq('external_post_id', bedrijf).select('post_id'); if (data?.length) enriched += data.length; }
  }
  return { notion_pages: pages.length, posts_upserted: upserted, bedrijfspagina_verrijkt: enriched, snapshots, metingen_zonder_meetdatum: zonderMeetdatum };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'CONFIG' }, 500);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bewijs = (groen: boolean, detail: unknown, klasse: string | null = null) => db.rpc('bg_bewijs', { p_bron: BRON, p_groen: groen, p_detail: detail, p_foutklasse: klasse }).then(() => {}, () => {});
  let token = Deno.env.get('NOTION_TOKEN') || '';
  if (!token) { const { data } = await db.rpc('bg_geheim', { p_naam: 'Notion' }); token = (data as string) || ''; }
  if (!token) { await bewijs(false, { error: 'NOTION_TOKEN_MISSING' }, 'AUTH'); return json({ error: 'NOTION_TOKEN_MISSING' }, 500); }
  const runId = crypto.randomUUID();
  try {
    const dagplan = await syncDagplan(db, token);
    const media = await syncMedia(db, token);
    const res = { ok: true, run_id: runId, dagplan, media };
    await db.from('bg_notion_sync').insert({ run_id: runId, wat: 'dagplan+mediakalender', records_gesyncet: dagplan.notion_count + media.posts_upserted, status: 'groen', fout: null, uitgevoerd_op: new Date().toISOString() });
    await bewijs(true, res);
    return json(res);
  } catch (e: any) {
    const message = String(e?.message || e).slice(0, 500);
    const err = { error: message, run_id: runId };
    const klass = message.startsWith('NOTION_ACCESS:') ? 'AUTH' : message.startsWith('DAGPLAN_CHANNEL_UNMAPPED:') ? 'VALIDATION' : 'VALIDATION';
    await db.from('bg_notion_sync').insert({ run_id: runId, wat: 'dagplan+mediakalender', records_gesyncet: 0, status: 'rood', fout: err.error, uitgevoerd_op: new Date().toISOString() });
    await bewijs(false, err, klass);
    return json(err, 500);
  }
});
