import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/social-recovery-runner/index.ts','utf8');

test('social recovery uses Supabase HTTP data plane and never a direct Postgres socket', () => {
  assert.doesNotMatch(source, /npm:postgres/);
  assert.doesNotMatch(source, /SUPABASE_DB_URL/);
  assert.doesNotMatch(source, /postgres\(/);
  assert.match(source, /\/rest\/v1\/rpc\/bg_geheim/);
  assert.match(source, /\/rest\/v1\/powerhouse_channel_decisions/);
  assert.match(source, /\/rest\/v1\/content_publication_obligations/);
  assert.match(source, /authorization.*Bearer/si);
  assert.match(source, /apikey/);
  assert.match(source, /AbortSignal\.timeout\(10_000\)/);
});

test('social recovery preserves canonical publisher and content-loop invocations', () => {
  assert.match(source, /"powerhouse-content-loop"/);
  assert.match(source, /"powerhouse-social-publisher"/);
  assert.match(source, /mode:\s*"publish_only"/);
  assert.match(source, /SERVICE_ROLE_REQUIRED/);
  assert.match(source, /SAME_DAY_RECOVERY_ONLY/);
});
