import { createClient } from 'npm:@supabase/supabase-js@2';

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3.1';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const clean = (v: unknown) => {
  const s = String(v ?? '').trim();
  return !s || s === '(not set)' || s === '(direct)' ? null : s;
};
const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
async function sha256(v: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function yesterdayUtc() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function extractReport(payload: any) {
  const candidates = [payload?.data, payload?.data?.data, payload?.data?.response?.data, payload?.response?.data, payload];
  const report = candidates.find(x => x && Array.isArray(x.dimensionHeaders) && Array.isArray(x.metricHeaders) && Array.isArray(x.rows));
  if (!report) throw new Error('GA4_REPORT_MISSING');
  return report;
}

function reportRows(report: any) {
  const dims = (report.dimensionHeaders || []).map((x: any) => x.name);
  const metrics = (report.metricHeaders || []).map((x: any) => x.name);
  return (report.rows || []).map((row: any) => {
    const out: Record<string, string> = {};
    dims.forEach((name: string, i: number) => out[name] = row.dimensionValues?.[i]?.value ?? '');
    metrics.forEach((name: string, i: number) => out[name] = row.metricValues?.[i]?.value ?? '');
    return out;
  });
}

async function callComposio(apiKey: string, connectedAccountId: string, property: string, day: string) {
  const res = await fetch(`${COMPOSIO_BASE}/tools/execute/GOOGLE_ANALYTICS_RUN_REPORT`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      arguments: {
        property,
        dateRanges: [{ startDate: day, endDate: day }],
        dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'sessionCampaignName' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'eventCount' }],
        limit: 250000,
        offset: 0,
        keepEmptyRows: false,
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.successful === false) throw new Error(`COMPOSIO_GA4_${res.status}:${String(body?.error || '').slice(0, 180)}`);
  return extractReport(body);
}

async function refreshNotion(url: string, serviceKey: string) {
  const res = await fetch(`${url}/functions/v1/bg-notion-sync`, {
    method: 'POST',
    headers: { authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
    body: '{}',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok !== true) throw new Error(`NOTION_REFRESH_${res.status}:${String(body?.error || '').slice(0, 140)}`);
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const url = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const composioKey = Deno.env.get('COMPOSIO_API_KEY') || '';
  const connectedAccountId = Deno.env.get('COMPOSIO_GA4_CONNECTED_ACCOUNT_ID') || '';
  const property = Deno.env.get('GA4_PROPERTY_RESOURCE') || '';
  if (!url || !serviceKey || !composioKey || !connectedAccountId || !/^properties\/\d+$/.test(property)) {
    return json({ error: 'ANALYTICS_SYNC_CONFIG_UNAVAILABLE' }, 503);
  }
  const callerAuthorization = req.headers.get('authorization') || '';
  if (callerAuthorization !== `Bearer ${serviceKey}`) {
    return json({ error: 'SERVICE_ROLE_REQUIRED' }, 401);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const runId = crypto.randomUUID();
  const day = yesterdayUtc();
  const started = new Date().toISOString();
  try {
    const notion = await refreshNotion(url, serviceKey);
    const report = await callComposio(composioKey, connectedAccountId, property, day);
    const rows = reportRows(report);
    const headers = ['date', 'pagePath', 'sessionCampaignName', 'sessions', 'activeUsers', 'eventCount'];
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h])).join(','))].join('\n') + '\n';
    if (new TextEncoder().encode(csv).byteLength > 5_000_000) throw new Error('GA4_CSV_TOO_LARGE');
    const csvHash = await sha256(csv);

    const batchInsert = await client.from('bg_ga4_csv_batches').insert({
      run_id: runId,
      period_start: day,
      period_end: day,
      csv_sha256: csvHash,
      csv_bytes: new TextEncoder().encode(csv).byteLength,
      csv_text: csv,
      source: 'composio',
      status: 'RECEIVED',
      rows_total: rows.length,
      detail: { notion_pages: notion.pages, notion_imported: notion.imported },
    });
    if (batchInsert.error) throw new Error(`GA4_BATCH_STORE:${batchInsert.error.message}`);

    const campaigns = [...new Set(rows.map(r => clean(r.sessionCampaignName)).filter(Boolean))] as string[];
    let matchedPosts: any[] = [];
    if (campaigns.length) {
      const lookup = await client.from('social_posts')
        .select('tenant_id,post_id,platform,external_post_id,source_campaign_id,topic,content_pillar,audience,funnel_stage,format,hook_type,narrative_type,emotion,cta_type,published_at')
        .eq('tenant_id', 'bedrijfsgeheugen')
        .in('source_campaign_id', campaigns);
      if (lookup.error) throw new Error(`CAMPAIGN_LOOKUP:${lookup.error.message}`);
      matchedPosts = lookup.data || [];
    }
    const byCampaign = new Map<string, any[]>();
    for (const post of matchedPosts) {
      const key = clean(post.source_campaign_id);
      if (!key) continue;
      byCampaign.set(key, [...(byCampaign.get(key) || []), post]);
    }

    const imports: any[] = [];
    let unmatched = 0;
    for (const r of rows) {
      const campaign = clean(r.sessionCampaignName);
      if (!campaign) continue;
      const matches = byCampaign.get(campaign) || [];
      if (matches.length !== 1) { unmatched++; continue; }
      const post = matches[0];
      imports.push({
        ...post,
        campaign_key: campaign,
        source_campaign_id: campaign,
        observed_at: new Date().toISOString(),
        bron: 'ga4-composio',
        source_event_id: `ga4:${day}:${post.post_id}:${r.pagePath || '/'}`,
        metrics: {
          sessions: Number(r.sessions || 0),
          active_users: Number(r.activeUsers || 0),
          event_count: Number(r.eventCount || 0),
          page_path: r.pagePath || '/',
          ga4_date: r.date || day,
        },
      });
    }

    let imported = 0;
    for (let offset = 0; offset < imports.length; offset += 500) {
      const posts = imports.slice(offset, offset + 500);
      const res = await fetch(`${url}/functions/v1/bg-post-import`, {
        method: 'POST',
        headers: { authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ posts }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`POST_IMPORT_${res.status}:${String(body?.error || '').slice(0, 140)}`);
      imported += Number(body?.metingen || posts.length);
    }

    const status = unmatched > 0 ? 'PARTIAL' : 'IMPORTED';
    await client.from('bg_ga4_csv_batches').update({
      status,
      rows_attributed: imports.length,
      rows_unmatched: unmatched,
      completed_at: new Date().toISOString(),
      detail: { notion_pages: notion.pages, notion_imported: notion.imported, campaigns: campaigns.length, matched_posts: matchedPosts.length, metrics_imported: imported },
    }).eq('run_id', runId);
    await client.from('bg_ga4_sync').insert({
      run_id: runId,
      afgelopen_uur: started,
      pages_opgehaald: rows.length,
      pages_bijgewerkt: imports.length,
      metingen_ingevuld: imported,
      status: status === 'IMPORTED' ? 'ok' : 'partial',
      fout: unmatched ? `${unmatched} campaign rows unmatched or ambiguous` : null,
      uitgevoerd_op: new Date().toISOString(),
    });
    return json({ ok: true, run_id: runId, day, rows: rows.length, attributed: imports.length, unmatched, imported, csv_sha256: csvHash, status }, unmatched ? 207 : 200);
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 300) : 'unknown';
    await client.from('bg_ga4_sync').insert({
      run_id: runId,
      afgelopen_uur: started,
      pages_opgehaald: 0,
      pages_bijgewerkt: 0,
      metingen_ingevuld: 0,
      status: 'error',
      fout: detail,
      uitgevoerd_op: new Date().toISOString(),
    });
    return json({ error: 'ANALYTICS_SYNC_FAILED', run_id: runId, detail }, 503);
  }
});
