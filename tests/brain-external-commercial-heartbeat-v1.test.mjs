import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const contract=JSON.parse(read('config/powerhouse-external-heartbeat-v1.json'));

test('Netlify scheduler is offset from legacy pg_cron heartbeat slots and only dispatches background work',()=>{
  const source=read('netlify/functions/powerhouse-commercial-heartbeat-schedule.mjs');
  assert.equal(contract.scheduler.schedule_utc,'2-57/5 * * * *');
  assert.match(source,/schedule:'2-57\/5 \* \* \* \*'/);
  assert.match(source,/powerhouse-commercial-heartbeat-background/);
  assert.match(source,/response\.status!==202/);
  assert.doesNotMatch(source,/powerhouse_commercial_heartbeat_v1/);
  assert.doesNotMatch(source,/SUPABASE_DB_URL/);
});

test('background delivery is authenticated, retry bounded and separated from the scheduled 30s budget',()=>{
  const source=read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
  assert.equal(contract.delivery.max_attempts,4);
  assert.match(source,/MAX_ATTEMPTS=4/);
  assert.match(source,/DELAYS_MS=\[0,5_000,15_000,30_000\]/);
  assert.match(source,/EDGE_TIMEOUT_MS=120_000/);
  assert.match(source,/x-bg-service-token/);
  assert.match(source,/powerhouse-commercial-heartbeat-runner/);
  assert.match(source,/durable_readback_verified/);
});

test('Edge runner bypasses PostgREST and executes through bounded IPv4 Supavisor transport',()=>{
  const source=read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
  const config=read('supabase/config.toml');
  assert.equal(contract.runner.pooler_port,6543);
  assert.equal(contract.runner.max_connections_per_isolate,1);
  assert.match(config,/\[functions\.powerhouse-commercial-heartbeat-runner\]/);
  assert.match(source,/DB_POOLER_HOST="aws-0-eu-central-1\.pooler\.supabase\.com"/);
  assert.match(source,/url\.port="6543"/);
  assert.match(source,/max:1/);
  assert.match(source,/statement_timeout = '90000ms'/);
  assert.match(source,/pg_try_advisory_xact_lock/);
  assert.match(source,/powerhouse_commercial_heartbeat_v1/);
  assert.match(source,/event_type='commercial_heartbeat'/);
  assert.match(source,/durable_readback_verified:true/);
  assert.doesNotMatch(source,/@supabase\/supabase-js/);
  assert.doesNotMatch(source,/\/rest\/v1/);
});

test('cutover remains two phase and cannot retire legacy pg_cron before external live proof',()=>{
  assert.equal(contract.cutover.legacy_pg_cron_job,'powerhouse-one-commercial-heartbeat-v1');
  assert.equal(contract.cutover.legacy_job_retired_only_after_external_live_proof,true);
});


test('overlap cannot count as success without a durable peer receipt',()=>{
  const runner=read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
  const background=read('netlify/functions/powerhouse-commercial-heartbeat-background.mjs');
  assert.match(runner,/COMPLETED_BY_PEER/);
  assert.match(runner,/durable_readback_verified:peerDurable/);
  assert.match(background,/body\?\.durable_readback_verified===true/);
  assert.doesNotMatch(background,/state==='SKIPPED_OVERLAP'/);
});


test('service token uses the proven portal hash contract without an Edge plaintext secret dependency',()=>{
  const source=read('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts');
  assert.match(source,/SERVICE_TOKEN_HASH="0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75"/);
  assert.match(source,/await sha256\(provided\)!==SERVICE_TOKEN_HASH/);
  assert.doesNotMatch(source,/Deno\.env\.get\("BG_PORTAL_EU_SERVICE_TOKEN"\)/);
  assert.doesNotMatch(source,/SERVER_AUTH_CONFIG_MISSING/);
});
