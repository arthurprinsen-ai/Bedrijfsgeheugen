import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../supabase/migrations/20261112190000_original_daily_source_immutable_obligation_ack_v1.sql',import.meta.url),'utf8');
const canonical=readFileSync(new URL('../supabase/migrations/20261112184500_original_daily_post_publication_metric_ack_v1.sql',import.meta.url),'utf8');

test('original source had immutable payload mutation; recovery removes it without changing guard',()=>{
 assert.match(canonical,/payload_sha256=excluded\.payload_sha256/);
 assert.doesNotMatch(src,/^\s*payload_sha256\s*=\s*excluded\.payload_sha256\s*,/m);
 assert.match(src,/ON CONFLICT\(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
 assert.match(src,/AND public\.brain_obligations\.evidence->>'source_revision'\s+IS DISTINCT FROM excluded\.evidence->>'source_revision'/);
 assert.doesNotMatch(src,/CREATE OR REPLACE FUNCTION public\.brain_guard_obligation_identity/i);
});
test('daily original consumer compares independently recomputed SHA to CURRENT evidence revision, not immutable identity',()=>{
 assert.match(src,/v_hash:=encode\(sha256\(convert_to\(v_manifest::text,'UTF8'\)\),'hex'\)/);
 assert.match(src,/AND v_brain\.evidence->>'source_revision'=v_hash/);
 assert.doesNotMatch(src,/v_hash=v_brain\.payload_sha256/);
 assert.match(src,/v_source_count>=8/);
});
test('revision handoff is idempotent and refreshes only on new source evidence, resets prior consumer claim',()=>{
 assert.match(src,/evidence=excluded\.evidence,\s+updated_at=v_now,\s+version=public\.brain_obligations\.version\+1/);
 assert.match(src,/'consumer_ack',jsonb_build_object\('accepted',false,'consumed_revision',null,'consumed_at',null\)/);
 assert.match(src,/WHERE public\.brain_obligations\.state<>'FULFILLED'/);
 assert.match(src,/'GROWTH_SOURCE_DAILY_HANDOFF'/);
 assert.match(src,/'posts_publication_and_metrics'/);
 assert.match(src,/'source_revision',v_revision/);
});
test('single original #175/#140 service-role writer; no new cron, provider action or public privilege',()=>{
 assert.equal((src.match(/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_(?:archive|consume)_v1\(/g)||[]).length,2);
 assert.match(src,/REVOKE ALL ON FUNCTION public\.powerhouse_daily_source_archive_v1\(date\) FROM PUBLIC,anon,authenticated/);
 assert.match(src,/REVOKE ALL ON FUNCTION public\.powerhouse_daily_source_consume_v1\(date\) FROM PUBLIC,anon,authenticated/);
 assert.match(src,/GRANT EXECUTE ON FUNCTION public\.powerhouse_daily_source_archive_v1\(date\) TO service_role/);
 assert.doesNotMatch(src,/\bcron\.schedule\s*\(/i);
 assert.doesNotMatch(src,/\bnet\.http_post\s*\(/i);
});
