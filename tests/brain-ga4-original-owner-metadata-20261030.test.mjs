import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/migrations/20261030165000_ga4_source_owner_reconciliation_v1.sql','utf8');
const original=readFileSync('supabase/functions/bg-analytics-sync-composio/index.ts','utf8');
const legacy=readFileSync('supabase/functions/bg-ga4-sync/index.ts','utf8');

test('original GA4 source owner migrates only retired collector to canonical owner',()=>{
 assert.match(source,/update public\.powerhouse_evidence_sources/);
 assert.match(source,/where source_key='ga4-analytics'/);
 assert.match(source,/and owner_component='bg-ga4-sync'/);
 assert.match(source,/owner_component='bg-analytics-sync-composio'/);
 assert.match(source,/GA4_UNEXPECTED_SOURCE_OWNER/);
 assert.match(source,/GA4_SOURCE_REGISTRY_ENTRY_MISSING/);
 assert.doesNotMatch(source,/update\s+(?:public\.)?(?:bg_ga4_csv_batches|powerhouse_evidence_source_observations|bg_gezondheid)/i);
 assert.doesNotMatch(source,/\b(?:truncate|delete from|drop table|create table|create policy|grant|cron\.schedule)\b/i);
});
test('GA4 reporting remains provider-driven, original, deduped and no second writer',()=>{
 assert.match(original,/const BRON='bg-analytics-sync-composio'/);
 assert.match(original,/function yesterdayUtc\(\)/);
 assert.match(original,/csv_sha256/);
 assert.match(original,/google-analytics-data-api/);
 assert.match(legacy,/status=410|json\([^\n]*410\)/);
 assert.match(legacy,/DEPRECATED/);
 assert.doesNotMatch(source,/source_key\s*=\s*'ga4-analytics'.*?(?:fresh|healthy)/i);
});
test('late-arriving GA4 on 30 Oct is not independently imported until original collector dated readback',()=>{
 assert.match(original,/const runId=crypto\.randomUUID\(\),day=yesterdayUtc\(\)/);
 assert.doesNotMatch(source,/(?:insert into|update)\s+public\.powerhouse_evidence_source_observations/i);
});
