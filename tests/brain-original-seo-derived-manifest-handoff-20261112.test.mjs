import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url),'utf8');

test('original #175 daily archive has exactly one guarded derived SEO source handoff',()=>{
 assert.match(sql,/powerhouse_daily_source_archive_v1\(date\)/);
 assert.match(sql,/seo_opportunity_intelligence/);
 assert.match(sql,/'seo-opportunity-intelligence'/);
 assert.match(sql,/'projection' AND required=false/);
 assert.match(sql,/'powerhouse-seo-opportunity-resolver-v1'/);
 assert.match(sql,/SEO_ORIGINAL_DERIVED_SOURCE_OWNER_DRIFT/);
 assert.match(sql,/SEO_ORIGINAL_ARCHIVE_DEFINITION_DRIFT/);
 assert.match(sql,/SEO_ORIGINAL_ARCHIVE_READBACK_FAILED/);
 assert.match(sql,/v_before:=|v_after:=replace\(v_before,v_marker,v_addition\)/);
});

test('derived source is explicitly distinct from external provider measurements and execution claims',()=>{
 assert.match(sql,/derived_intelligence_not_provider_evidence',true/);
 assert.match(sql,/not_provider_search_or_traffic',true/);
 assert.match(sql,/independent_cro_execution_and_effect_still_required',true/);
 assert.match(sql,/DERIVED_SEO_OPPORTUNITY_OBSERVED/);
 assert.match(sql,/MISSING_DERIVED_SEO_OPPORTUNITY/);
 assert.match(sql,/o\.observation_id::text\|\|':'\|\|o\.observed_at::text/);
 assert.match(sql,/md5\(o\.evidence::text\)/);
 assert.match(sql,/o\.observed_at>=v_start AND o\.observed_at<v_end/);
 const executable=sql.replace(/^--.*$/gm,'');
 assert.doesNotMatch(executable,/\bcron\.schedule\s*\(|\bGRANT\b|\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
});

test('same original source event feeds current raw revision and named ONE BRAIN plus Heartbeat',()=>{
 const original=readFileSync(new URL('../supabase/migrations/20261112194500_original_growth_source_revision_identity_fix_v1.sql',import.meta.url),'utf8');
 assert.match(original,/powerhouse_daily_source_archive_v1/i);
 assert.match(original,/powerhouse_daily_source_consume_v1/i);
 assert.match(original,/powerhouse_commercial_intelligence_heartbeat_v1/i);
 assert.match(original,/source_revision/i);
 const agent=readFileSync(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
 assert.match(agent,/verify-original-derived-seo-observation-in-175-manifest-140-consumer-heartbeat-sha/);
});
