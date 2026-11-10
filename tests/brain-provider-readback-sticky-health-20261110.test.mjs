import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20261110153331_linkedin_org_readback_sticky_provider_health_v1.sql', import.meta.url),
  'utf8'
);

test('same existing provider health view: security invoker and no parallel executor', () => {
  assert.match(sql, /create or replace view public\.powerhouse_provider_health_v1\s+with \(security_invoker = true\)/i);
  assert.match(sql, /alter view public\.powerhouse_provider_health_v1\s+set \(security_invoker = true\)/i);
  assert.match(sql, /revoke all on table public\.powerhouse_provider_health_v1\s+from public, anon, authenticated;/i);
  assert.doesNotMatch(sql, /\bcron\.schedule\s*\(|\bnet\.http_post\s*\(|create\s+(table|trigger)\b/i);
});

test('provider denial is sticky beyond 24h while original readback remains unverified', () => {
  assert.match(sql, /denied\.event_type='provider_capability_readback_denied'/);
  assert.match(sql, /not exists\s*\(\s*select 1\s*from public\.powerhouse_runtime_events restored/i);
  assert.match(sql, /when coalesce\(d\.unresolved_denials,0\)>0 then 'degraded'/);
  assert.match(sql, /when r\.errors_24h>0 then 'degraded'/);
});

test('only matching independently observed provider readback can clear exact denial', () => {
  for (const condition of [
    "restored.source=denied.source",
    "restored.subject_key is not distinct from denied.subject_key",
    "restored.channel is not distinct from denied.channel",
    "restored.event_type='provider_capability_readback_restored'",
    "restored.state='closed'",
    "restored.occurred_at>denied.occurred_at",
    "restored.evidence->>'independent_readback_verified'='true'",
    "restored.evidence->>'provider_http_status'='200'",
    "nullif(restored.evidence->>'provider_source_event_id','') is not null",
    "restored.evidence->>'organization_urn'=denied.subject_key",
    "restored.evidence->>'readback_target'=denied.evidence->>'readback_target'",
  ]) assert.ok(sql.includes(condition), 'missing fail-closed entitlement proof: '+condition);
});

test('projection preserves original columns and exposes the unresolved guard as evidence only', () => {
  for (const key of [
    'as provider_key','r.events_24h','r.errors_24h','r.last_event_at',
    'r.last_error_at','sf.freshness_status','sf.health_checked_at',
    'as provider_state','as evidence'
  ]) assert.ok(sql.includes(key), 'missing existing view column: '+key);
  assert.match(sql, /'unresolved_capability_readback_denials',coalesce\(d\.unresolved_denials,0\)/);
});
