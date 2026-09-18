import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn = fs.readFileSync('supabase/functions/bg-opdrachtenradar/index.ts', 'utf8');
const sql = fs.readFileSync('supabase/migrations/20260918130000_bg_opdrachtenradar_nightly_v1.sql', 'utf8');

test('Opdrachtenradar producer is authenticated and reads every secret from Vault', () => {
  assert.match(fn, /x-powerhouse-token/);
  assert.match(fn, /powerhouse_daily_scheduler_token/);
  for (const naam of ['TAVILY_API_KEY', 'ANTHROPIC_API_KEY']) assert.match(fn, new RegExp(`geheim\\('${naam}'\\)`));
  assert.doesNotMatch(fn, /Deno\.env\.get\('(TAVILY|ANTHROPIC)/);
  assert.doesNotMatch(fn, /(tvly-|sk-ant-)[A-Za-z0-9]/);
});

test('Opdrachtenradar tables are server-only', () => {
  for (const t of ['bg_opdrachten', 'bg_opdrachten_genegeerd', 'bg_opdrachten_profiel']) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`));
    assert.match(sql, new RegExp(`revoke all on table public\\.${t} from public, anon, authenticated`));
    assert.match(sql, new RegExp(`grant all on table public\\.${t} to service_role`));
  }
  assert.doesNotMatch(sql, /security\s+definer/i);
});

test('Opdrachtenradar runs nightly through the existing scheduler authority', () => {
  assert.match(sql, /cron\.schedule\('bg-opdrachtenradar-nightly','30 1 \* \* \*'/);
  assert.match(sql, /functions\/v1\/bg-opdrachtenradar/);
  assert.match(sql, /powerhouse_daily_scheduler_token/);
});

test('every producer run leaves canonical evidence, also when nothing new is found', () => {
  assert.match(sql, /'opdrachtenradar', 'external_intelligence'/);
  assert.match(fn, /powerhouse_record_source_observation_v1/);
  assert.match(fn, /opdrachtenradar-producer-run:/);
  assert.match(fn, /PRODUCER_HEARTBEAT/);
  assert.match(fn, /bg_gezondheid/);
});

test('url hash matches the Opdrachtenradar app so both use the same row key', () => {
  const bron = fn.match(/const hashUrl = \(s: string\) => (\{[^\n]+\});/);
  assert.ok(bron, 'hashUrl must stay a one-line djb2 helper');
  const hashUrl = new Function('s', bron[1].replace(/^\{|\}$/g, ''));
  const app = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'o' + h.toString(36); };
  for (const u of ['https://www.freelance.nl/opdracht/123-data-engineer', 'https://striive.com/nl/opdrachten/abc?x=1', '']) assert.equal(hashUrl(u), app(u));
});
