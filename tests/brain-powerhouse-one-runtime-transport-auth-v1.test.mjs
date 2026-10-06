import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const growth=fs.readFileSync('supabase/functions/growth-datahub-ingest/index.ts','utf8');
const portal=fs.readFileSync('supabase/functions/portal-state-eu/index.ts','utf8');
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

test('Netlify CMS gateway and CDN absorb repeat public reads',()=>{
  assert.match(gateway,/AbortSignal\.timeout\(3500\)/);
  assert.match(gateway,/CMS_GATEWAY_TIMEOUT/);
  assert.match(gateway,/failure\.status=503/);
  assert.match(cmsPublic,/netlify-cdn-cache-control/);
  assert.match(cmsPublic,/durable, s-maxage=60, stale-while-revalidate=600/);
  assert.match(cmsPublic,/status===200/);
  assert.match(cmsPublic,/no-store/);
});
