import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const growth=fs.readFileSync('supabase/functions/growth-datahub-ingest/index.ts','utf8');
const portal=fs.readFileSync('supabase/functions/portal-state-eu/index.ts','utf8');
const revenue=fs.readFileSync('supabase/functions/revenue-learning-store/index.ts','utf8');
const social=fs.readFileSync('supabase/functions/social-learning-store/index.ts','utf8');
const predictive=fs.readFileSync('supabase/functions/powerhouse-predictive-engine/index.ts','utf8');
const calibrator=fs.readFileSync('supabase/functions/powerhouse-forecast-calibrator/index.ts','utf8');
const visual=fs.readFileSync('supabase/functions/powerhouse-visual-assurance-sync/index.ts','utf8');
const mira=fs.readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const email=fs.readFileSync('supabase/functions/powerhouse-email-reply-loop/index.ts','utf8');
const gateway=fs.readFileSync('netlify/functions/_cms-gateway.mjs','utf8');
const cmsPublic=fs.readFileSync('netlify/functions/cms-public.mjs','utf8');

test('growth telemetry cannot hold the Data API during database pressure',()=>{
  assert.match(growth,/EVENT_DB_TIMEOUT_MS=2_500/);
  assert.match(growth,/EVENT_BREAKER_MS=30_000/);
  assert.match(growth,/DATA_API_CIRCUIT_OPEN/);
  assert.match(growth,/AbortSignal\.timeout\(EVENT_DB_TIMEOUT_MS\)/);
  assert.match(growth,/EVENT_STORE_UNAVAILABLE/);
  assert.doesNotMatch(growth,/EVENT_STORE_FAILED.*500/);
});

test('public CMS reads fail fast and preserve a bounded stale read model',()=>{
  assert.match(portal,/CMS_DB_TIMEOUT_MS=2_500/);
  assert.match(portal,/CMS_BREAKER_MS=30_000/);
  assert.match(portal,/CMS_CACHE_FRESH_MS=60_000/);
  assert.match(portal,/CMS_CACHE_STALE_MS=600_000/);
  assert.match(portal,/edge-memory-stale/);
  assert.match(portal,/CMS_PUBLIC_UNAVAILABLE/);
  assert.match(portal,/AbortSignal\.timeout\(CMS_DB_TIMEOUT_MS\)/);
});

test('learning stores cannot recreate the parallel PostgREST fan-out',()=>{
  assert.match(revenue,/STORE_DB_TIMEOUT_MS=2_500/);
  assert.match(revenue,/PROJECTION_BREAKER_MS=30_000/);
  assert.match(revenue,/PROJECTION_STORE_UNAVAILABLE/);
  assert.match(revenue,/AbortSignal\.timeout\(STORE_DB_TIMEOUT_MS\)/);
  assert.doesNotMatch(revenue,/Promise\.all\(\[\s*db\.from\('social_posts'/);
  assert.match(social,/STORE_DB_TIMEOUT_MS=2_500/);
  assert.match(social,/STORE_OPERATION_UNAVAILABLE/);
  assert.match(social,/AbortSignal\.timeout\(STORE_DB_TIMEOUT_MS\)/);
});

test('scheduler auth distinguishes infrastructure failure from credential failure',()=>{
  for(const source of [predictive,calibrator,visual,mira]){
    assert.match(source,/AUTH_SECRET_LOOKUP_FAILED/);
    assert.match(source,/AUTH_SECRET_EMPTY/);
    assert.match(source,/TOKEN_MISMATCH/);
    assert.doesNotMatch(source,/!expected\|\|.*UNAUTHORIZED/);
  }
  assert.match(predictive,/AUTH_CACHE_MS=15\*60_000/);
  assert.match(calibrator,/AUTH_CACHE_MS=15\*60_000/);
  assert.match(visual,/AUTH_CACHE_MS=15\*60_000/);
  assert.match(mira,/AUTH_CACHE_MS=15\*60_000/);
});

test('email reply loop canonicalizes and caches Vault-backed service secrets',()=>{
  assert.match(email,/SECRET_CACHE_MS=15\*60_000/);
  assert.match(email,/secretCache=new Map/);
  assert.match(email,/SECRET_LOOKUP_FAILED/);
  assert.match(email,/AUTH_SECRET_LOOKUP_FAILED/);
  assert.match(email,/AUTH_SECRET_EMPTY/);
  assert.match(email,/TOKEN_MISMATCH/);
  assert.doesNotMatch(email,/error:'UNAUTHORIZED'/);
});

test('Netlify CMS gateway and CDN absorb repeat public reads',()=>{
  assert.match(gateway,/AbortSignal\.timeout\(3500\)/);
  assert.match(gateway,/CMS_GATEWAY_TIMEOUT/);
  assert.match(gateway,/failure\.status=503/);
  assert.match(cmsPublic,/netlify-cdn-cache-control/);
  assert.match(cmsPublic,/durable, s-maxage=60, stale-while-revalidate=600/);
  assert.match(cmsPublic,/status===200/);
  assert.match(cmsPublic,/no-store/);
});
