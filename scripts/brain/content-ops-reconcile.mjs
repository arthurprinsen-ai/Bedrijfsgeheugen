import fs from 'node:fs';

const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
if (!base || !key) {
  console.error('CONTENT_OPS_RECONCILE_BLOCKED: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(2);
}

const ledger = JSON.parse(fs.readFileSync('data/content-publication-ledger.json', 'utf8'));
const rows = Object.entries(ledger.days || {}).map(([date, item]) => {
  const slug = String(item?.slug || '').trim();
  const contentId = String(item?.content_id || (slug ? `blog:${slug}` : '')).trim();
  const state = String(item?.state || 'selected').toLowerCase();
  const selectedAt = item?.selected_at || null;
  const liveAt = item?.live_at || null;
  const liveUrl = item?.live_url || (slug ? `https://www.bedrijfsgeheugen.nl/blog/${slug}/` : null);
  return {
    content_key: `blog-ledger:${date}:${contentId || slug || 'unknown'}`,
    tenant_id: 'bedrijfsgeheugen',
    content_type: 'blog',
    channel: 'blog',
    title: slug || contentId || `Blog ${date}`,
    slug: slug || null,
    campaign_key: `rci-${date}`,
    planned_for: `${date}T00:00:00+02:00`,
    generated_at: selectedAt,
    published_at: state === 'live' ? (item?.merged_at || liveAt) : null,
    live_verified_at: state === 'live' ? liveAt : null,
    publication_url: liveUrl,
    proof_url: state === 'live' ? liveUrl : null,
    status: state === 'live' ? 'verified' : (selectedAt ? 'generated' : 'planned'),
    source_system: 'content-publication-ledger',
    source_ref: {
      business_date: date,
      content_id: contentId || null,
      ledger_state: state,
      live_proof: item?.live_proof || null,
    },
    updated_at: new Date().toISOString(),
  };
}).filter((row) => row.slug || row.source_ref.content_id);

if (!rows.length) {
  console.log('CONTENT_OPS_RECONCILE_NOOP: blog ledger has no records');
  process.exit(0);
}

const url = new URL(`${base}/rest/v1/content_operations_registry`);
url.searchParams.set('on_conflict', 'content_key');
const response = await fetch(url, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});

if (!response.ok) {
  console.error(`CONTENT_OPS_RECONCILE_BLOCKED: upsert failed ${response.status} ${await response.text()}`);
  process.exit(2);
}

console.log(`CONTENT_OPS_RECONCILE_OK: ${rows.length} blog ledger record(s) synchronized`);
