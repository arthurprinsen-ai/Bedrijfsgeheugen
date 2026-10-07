import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const contract=JSON.parse(read('config/powerhouse-runtime-backpressure-v1.json'));

test('CMS public path has bounded origin time, stale fallback and a shared breaker',()=>{
  const gateway=read('netlify/functions/_cms-gateway.mjs');
  const pub=read('netlify/functions/cms-public.mjs');
  assert.equal(contract.cms_public.gateway_timeout_ms,2500);
  assert.match(gateway,/AbortSignal\.timeout/);
  assert.match(pub,/GATEWAY_TIMEOUT_MS=2_500/);
  assert.match(pub,/STALE_MS=15\*60_000/);
  assert.match(pub,/BREAKER_MS=30_000/);
  assert.match(pub,/DATA_API_CIRCUIT_OPEN/);
  assert.match(pub,/return json\(\{items:\[\],surface,locale,route,degraded:true,reason/);
  assert.doesNotMatch(pub,/CMS_PUBLIC_FAILED/);
});

test('growth visitor path is durable queue only and never calls Supabase synchronously',()=>{
  const ingress=read('netlify/functions/growth-event.mjs');
  assert.equal(contract.growth_events.visitor_path,'durable_queue_only');
  assert.match(ingress,/store\.setJSON/);
  assert.match(ingress,/queue:'durable'/);
  assert.doesNotMatch(ingress,/functions\/v1\/growth-datahub-ingest/);
  assert.doesNotMatch(ingress,/BG211_WEBHOOK_URL/);
});

test('scheduled growth drain is bounded, timeout protected and stops on first backend failure',()=>{
  const drain=read('netlify/functions/growth-drain.mjs');
  const replay=read('netlify/functions/growth-replay.mjs');
  assert.equal(contract.growth_events.drain_batch_max,10);
  assert.match(drain,/MAX_BATCH=10/);
  assert.match(drain,/schedule:'\* \* \* \* \*'/);
  assert.match(replay,/DATAHUB_TIMEOUT_MS=2_500/);
  assert.match(replay,/if\(!datahub\.persisted\)[\s\S]*break;/);
  assert.match(replay,/if\(delivery\.attempted&&!delivery\.delivered\)\{failed\+\+;break;\}/);
});


test('scheduler auth bypasses PostgREST and uses the bounded IPv4 Supavisor authority',()=>{
  const helper=read('supabase/functions/_shared/powerhouse-scheduler-auth.ts');
  assert.equal(contract.service_auth.pooler_port,6543);
  assert.equal(contract.service_auth.max_connections_per_isolate,1);
  assert.equal(contract.service_auth.cache_ms,300000);
  assert.match(helper,/DB_POOLER_HOST='aws-0-eu-central-1\.pooler\.supabase\.com'/);
  assert.match(helper,/url\.port='6543'/);
  assert.match(helper,/max:1/);
  assert.match(helper,/AUTH_CACHE_MS=300_000/);
  assert.match(helper,/POWERHOUSE_DAILY_SCHEDULER_TOKEN/);
  assert.match(helper,/AUTH_SECRET_LOOKUP_FAILED/);
  assert.match(helper,/TOKEN_REQUIRED/);
  assert.match(helper,/TOKEN_MISMATCH/);

  for(const slug of contract.service_auth.protected_functions){
    const source=read('supabase/functions/'+slug+'/index.ts');
    assert.match(source,/authorizePowerhouseScheduler/);
    assert.doesNotMatch(source,/bg_geheim'\s*,?\s*\{p_naam:'powerhouse_daily_scheduler_token'/);
  }
});


test('public runtime verifier is retired and cannot amplify database outages',()=>{
  const verifier=read('supabase/functions/powerhouse-runtime-verifier-v1/index.ts');
  const config=read('supabase/config.toml');
  assert.equal(contract.runtime_verifier.state,'RETIRED_DIAGNOSTIC');
  assert.equal(contract.runtime_verifier.public_db_probe,false);
  assert.equal(contract.runtime_verifier.response_status,410);
  assert.equal(contract.runtime_verifier.replacement,'commercial-heartbeat-and-runtime-readback');
  assert.ok(contract.runtime_verifier.authority.includes('supabase-provider-logs'));
  assert.ok(contract.runtime_verifier.authority.includes('supabase-management-api'));
  assert.ok(contract.runtime_verifier.authority.includes('powerhouse-commercial-heartbeat-v1'));
  assert.match(config,/\[functions\.powerhouse-runtime-verifier-v1\]/);
  assert.match(verifier,/retired:true/);
  assert.match(verifier,/status:"RETIRED_DIAGNOSTIC"/);
  assert.match(verifier,/database_probe_performed:false/);
  assert.match(verifier,/replacement:"commercial-heartbeat-and-runtime-readback"/);
  assert.match(verifier,/status:410/);
  assert.doesNotMatch(verifier,/postgres@/);
  assert.doesNotMatch(verifier,/SUPABASE_DB_URL/);
  assert.doesNotMatch(verifier,/select 1/);
  assert.doesNotMatch(verifier,/TOKEN_HASH/);
  assert.doesNotMatch(verifier,/x-bg-runtime-verifier-token/);
});


test('email reply-loop never returns raw dependency errors to callers',()=>{
  const source=read('supabase/functions/powerhouse-email-reply-loop/index.ts');
  assert.match(source,/error:'EMAIL_REPLY_LOOP_FAILED'/);
  assert.match(source,/detail:'EMAIL_REPLY_LOOP_FAILED'/);
  assert.doesNotMatch(source,/error:message/);
  assert.doesNotMatch(source,/GMAIL_DISCOVERY_'\+r\.status\+'\:'/);
  assert.doesNotMatch(source,/GMAIL_FETCH_'\+r\.status\+'\:'/);
});
