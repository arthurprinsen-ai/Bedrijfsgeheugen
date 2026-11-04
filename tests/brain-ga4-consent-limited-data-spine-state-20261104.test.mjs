import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const migration=readFileSync(new URL('../supabase/migrations/20261104090000_ga4_consent_limited_data_spine_truth_v1.sql',import.meta.url),'utf8');
const source=readFileSync(new URL('../supabase/functions/bg-analytics-sync-composio/index.ts',import.meta.url),'utf8');
test('preserves original Data Spine source registry and all ten source rows',()=>{
 assert.match(migration,/GA4_ORIGINAL_DATA_SPINE_SOURCE_AUTHORITY_DRIFT/);
 assert.match(migration,/owner_component='bg-analytics-sync-composio'/);
 assert.match(migration,/writer_contract='ga4-observed-metrics-v1'/);
 const named=[...migration.matchAll(/\('([^']+)'::text,'[^']+'::text,(?:true|false)\)/g)].map(x=>x[1]);
 assert.deepEqual(named,['ga4-analytics','gsc-search','linkedin','composio-linkedin-publication','instagram-social','social-buffer','tavily-intelligence','external-intelligence','dataforseo-intelligence','portal-state']);
 assert.match(migration,/create or replace view public\.powerhouse_data_spine_health_v1\s+with \(security_invoker=true\) as/);
});
test('explicit true consent boundary cannot be inferred from HTTP200 or empty CSV alone',()=>{
 for(const part of [
  "latest.status='privacy_limited'","latest.fout='GA4_CONSENT_LIMITED_NO_SOURCE_ROWS'",
  "e.event_type='ga4_source_empty_observed'","e.subject_key='ga4-analytics'",
  "e.evidence->>'run_id'=latest.run_id::text","e.state='observed'",
  "e.evidence->>'source_data_available'='false'",
  "e.evidence->>'consented_human_first_party_event_present'='false'",
  "e.evidence->'aggregate_probe'->>'sessions'='0'",
  "e.evidence->'aggregate_probe'->>'event_count'='0'"
 ])assert.ok(migration.includes(part),part);
 assert.match(migration,/and v\.run_id is not null/);
 assert.match(migration,/then 'CONSENT_LIMITED'/);
 assert.match(migration,/then 'RECOVERY_DUE'/);
 assert.match(source,/consentedHumanEvidence===false && aggregate!==null && !totalsPositive/);
});
test('bounded consent evidence expires and a later new source failure cannot be hidden',()=>{
 assert.match(migration,/latest\.uitgevoerd_op >= now\(\)-interval '8 hours'/);
 assert.match(migration,/latest\.uitgevoerd_op <= now\(\)/);
 assert.match(migration,/order by uitgevoerd_op desc\s+limit 1/);
 assert.match(migration,/left join verified_consent_boundary v on s\.source_key='ga4-analytics'/);
 assert.match(migration,/when s\.source_key='ga4-analytics'/);
});
test('never fabricates fresh GA4 measurements or degrades existing permission boundaries',()=>{
 assert.match(migration,/when s\.latest_observed_at is null then 'NOT_OBSERVED'/);
 assert.match(migration,/when now\(\)-s\.latest_observed_at > s\.max_age then 'STALE'/);
 assert.match(migration,/else 'FRESH'/);
 assert.match(migration,/GA4_CONSENT_PROOF_CANNOT_CREATE_FRESH_SOURCE/);
 assert.match(migration,/revoke all on public\.powerhouse_data_spine_health_v1 from public,anon,authenticated/);
 assert.match(migration,/grant select on public\.powerhouse_data_spine_health_v1 to service_role/);
 assert.doesNotMatch(migration,/\b(update|insert into|delete from)\s+public\.(bg_interacties|bg_ga4_sync|powerhouse_evidence_source_observations)\b/i);
 assert.doesNotMatch(migration,/cron\.(?:schedule|unschedule)|net\.http_post|provider_send|force.*consent/i);
});
test('non-GA4 producers still retain original policy and no false-green default',()=>{
 assert.match(migration,/when s\.producer_required and s\.latest_observed_at is null then 'PRODUCER_OR_INGEST_GAP'/);
 assert.match(migration,/when s\.producer_required and s\.latest_observed_at is not null and now\(\)-s\.latest_observed_at > s\.max_age then 'RECOVERY_DUE'/);
 assert.match(migration,/else 'HEALTHY'/);
});
