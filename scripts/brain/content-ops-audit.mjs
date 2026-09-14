const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

if (!base || !key) {
  console.error('CONTENT_OPS_AUDIT_BLOCKED: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(2);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: 'application/json',
};

const url = new URL(`${base}/rest/v1/content_operations_dashboard`);
url.searchParams.set('select', 'content_key,content_type,channel,planned_for,published_at,live_verified_at,publication_url,proof_url,lifecycle_status,needs_attention,last_error,updated_at');
url.searchParams.set('needs_attention', 'eq.true');
url.searchParams.set('order', 'updated_at.desc');
url.searchParams.set('limit', '100');

const response = await fetch(url, { headers });
if (!response.ok) {
  console.error(`CONTENT_OPS_AUDIT_BLOCKED: query failed ${response.status} ${await response.text()}`);
  process.exit(2);
}

const rows = await response.json();
const publishedWithoutProof = rows.filter((r) => r.published_at && !r.live_verified_at);
const overdueOrFailed = rows.filter((r) => !r.published_at || r.last_error);

console.log(JSON.stringify({
  checked_at: new Date().toISOString(),
  attention_count: rows.length,
  published_without_live_proof: publishedWithoutProof.length,
  overdue_or_failed: overdueOrFailed.length,
  items: rows,
}, null, 2));

if (rows.length) {
  console.error(`CONTENT_OPS_AUDIT_RED: ${rows.length} content item(s) require attention`);
  process.exit(1);
}

console.log('CONTENT_OPS_AUDIT_GREEN: no overdue, failed, or published-without-proof content');
