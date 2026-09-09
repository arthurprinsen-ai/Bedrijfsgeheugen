import { createClient } from 'npm:@supabase/supabase-js@2';

const NOTION_VERSION = '2025-09-03';
const DEFAULT_DATA_SOURCE = '626e4c3c-cfee-4390-b519-6a910538607d';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

function propertyText(prop: any): string | null {
  if (!prop) return null;
  if (prop.type === 'select') return prop.select?.name?.trim() || null;
  if (prop.type === 'status') return prop.status?.name?.trim() || null;
  if (prop.type === 'rich_text') return (prop.rich_text || []).map((x: any) => x.plain_text || '').join('').trim() || null;
  if (prop.type === 'title') return (prop.title || []).map((x: any) => x.plain_text || '').join('').trim() || null;
  if (prop.type === 'url') return prop.url?.trim() || null;
  if (prop.type === 'unique_id') return prop.unique_id?.number != null ? `${prop.unique_id.prefix || ''}${prop.unique_id.number}` : null;
  if (prop.type === 'multi_select') return (prop.multi_select || []).map((x: any) => x.name).filter(Boolean).join(', ') || null;
  return null;
}
const lower = (v: string | null) => v?.toLowerCase() || null;

function importsForPage(page: any) {
  const p = page?.properties || {};
  const sourceCampaign = propertyText(p['Leadbroncode']) || propertyText(p['Campagne']);
  const common = {
    tenant_id: 'bedrijfsgeheugen',
    hook_type: lower(propertyText(p['Hook type'])),
    format: lower(propertyText(p['Media type'])),
    narrative_type: lower(propertyText(p['Narrative role']) || propertyText(p['Narrative arc'])),
    emotion: lower(propertyText(p['Emotion'])),
    cta_type: lower(propertyText(p['CTA type'])),
    topic: propertyText(p['Contentpijler']) || propertyText(p['Weekthema']),
    source_campaign_id: sourceCampaign,
    bron: 'notion',
  };
  const out: any[] = [];
  const li = propertyText(p['Post ID LinkedIn']);
  if (li) out.push({ ...common, platform: 'linkedin', external_post_id: li, post_id: `linkedin:${li}` });
  const ig = propertyText(p['Post ID Instagram']);
  if (ig) out.push({ ...common, platform: 'instagram', external_post_id: ig, post_id: `instagram:${ig}` });
  const slug = propertyText(p['SEO Slug']);
  return out.map(row => ({
    import: row,
    staging: {
      post_id: row.post_id,
      platform: row.platform,
      external_post_id: row.external_post_id,
      page_path: slug ? `/${slug.replace(/^\/+/, '')}` : null,
      notion_url: page.url || null,
      notion_page_id: page.id || null,
      hook_type: row.hook_type,
      format: row.format,
      narrative_type: row.narrative_type,
      emotion: row.emotion,
      cta_type: row.cta_type,
      topic: row.topic,
      campaign_key: sourceCampaign,
      synced_at: new Date().toISOString(),
      synced_from: 'notion-api',
    },
  }));
}

async function readNotion(token: string, dataSource: string) {
  const pages: any[] = [];
  let cursor: string | undefined;
  for (let n = 0; n < 20; n++) {
    const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSource}/query`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'notion-version': NOTION_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`NOTION_HTTP_${res.status}:${String(body?.message || '').slice(0, 160)}`);
    pages.push(...(Array.isArray(body?.results) ? body.results : []));
    if (!body?.has_more || !body?.next_cursor) return pages;
    cursor = body.next_cursor;
  }
  throw new Error('NOTION_PAGINATION_LIMIT');
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const notionToken = Deno.env.get('NOTION_TOKEN') || '';
  const dataSource = Deno.env.get('NOTION_MEDIA_DATA_SOURCE_ID') || DEFAULT_DATA_SOURCE;
  if (!url || !serviceKey || !notionToken) return json({ error: 'NOTION_SYNC_CONFIG_UNAVAILABLE' }, 503);

  try {
    const pages = await readNotion(notionToken, dataSource);
    const mapped = pages.flatMap(importsForPage);
    if (!mapped.length) return json({ error: 'NOTION_SYNC_NO_POST_IDS', pages: pages.length }, 503);

    const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const staging = mapped.map(x => x.staging);
    const staged = await client.from('notion_synced_posts').upsert(staging, { onConflict: 'post_id', ignoreDuplicates: false });
    if (staged.error) throw new Error(`NOTION_STAGING:${staged.error.message}`);

    let imported = 0;
    for (let offset = 0; offset < mapped.length; offset += 500) {
      const posts = mapped.slice(offset, offset + 500).map(x => x.import);
      const res = await fetch(`${url}/functions/v1/bg-post-import`, {
        method: 'POST',
        headers: { authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ posts }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`POST_IMPORT_${res.status}:${String(body?.error || '').slice(0, 120)}`);
      imported += Number(body?.posts || posts.length);
    }
    return json({ ok: true, pages: pages.length, mapped: mapped.length, imported, data_source: dataSource }, 200);
  } catch (error) {
    return json({ error: 'NOTION_SYNC_FAILED', detail: error instanceof Error ? error.message.slice(0, 240) : 'unknown' }, 503);
  }
});
