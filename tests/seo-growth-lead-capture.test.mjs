import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files=async()=>Promise.all([
  readFile('netlify/functions/monitor.mjs','utf8'),
  readFile('netlify/functions/_commercial-lead.mjs','utf8'),
  readFile('supabase/migrations/20260906115346_commercial_lead_capture.sql','utf8'),
  readFile('supabase/functions/commercial-lead-ingest/index.ts','utf8')
]);

test('monitor bewaart rapport-lead in EU store en Make is alleen best-effort',async()=>{
  const [monitor]=await files();
  assert.match(monitor,/captureCommercialLead/);
  assert.match(monitor,/qualified_lead/);
  assert.match(monitor,/makeForwarded/);
  assert.doesNotMatch(monitor,/return Response\.json\([^]*detail:\s*'make '\s*\+\s*r\.status[^]*status:\s*502/);
});

test('lead helper stuurt PII alleen naar private lead store en growth outcome zonder PII',async()=>{
  const [,helper]=await files();
  assert.match(helper,/commercial-lead-ingest/);
  assert.match(helper,/growth-datahub-ingest/);
  assert.match(helper,/stage:\s*'qualified_lead'/);
  assert.match(helper,/email/);
  assert.match(helper,/outcome/);
  assert.doesNotMatch(helper,/outcome[^;]{0,500}email/i);
});

test('commercial lead tabel is server-only, idempotent en heeft retentie',async()=>{
  const [,,migration,edge]=await files();
  assert.match(migration,/create table if not exists public\.commercial_leads/i);
  assert.match(migration,/idempotency_key\s+text\s+not null\s+unique/i);
  assert.match(migration,/expires_at/i);
  assert.match(migration,/enable row level security/i);
  assert.match(migration,/revoke all on public\.commercial_leads from anon, authenticated/i);
  assert.match(edge,/x-bg-service-token/i);
  assert.match(edge,/commercial_leads/);
});
