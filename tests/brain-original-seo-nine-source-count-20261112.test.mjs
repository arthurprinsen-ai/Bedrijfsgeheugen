import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/migrations/20261112220500_original_seo_manifest_nine_source_guard_v1.sql',import.meta.url),'utf8');
const existing=readFileSync(new URL('../supabase/migrations/20261112214500_original_seo_derived_brain_manifest_handoff_v1.sql',import.meta.url),'utf8');

test('original #175 has nine *expected* source rows, preserving all earlier source truth',()=>{
 assert.match(existing,/seo_opportunity_intelligence/);
 assert.match(existing,/DERIVED_SEO_OPPORTUNITY_OBSERVED/);
 assert.match(existing,/MISSING_DERIVED_SEO_OPPORTUNITY/);
 assert.ok(source.includes("v_old constant text := 'IF v_manifest IS NULL OR v_saved<>8 THEN'"));
 assert.ok(source.includes("v_new constant text := 'IF v_manifest IS NULL OR v_saved<>9 THEN'"));
 assert.match(source,/SEO_ORIGINAL_NINE_SOURCE_COUNT_DEFINITION_DRIFT/);
 assert.match(source,/SEO_ORIGINAL_NINE_SOURCE_COUNT_PATCH_INCOMPLETE/);
 assert.match(source,/SEO_ORIGINAL_NINE_SOURCE_COUNT_READBACK_FAILED/);
});

test('repair remains strict, source-registered, original function only, with no additional executor',()=>{
 assert.match(source,/powerhouse_evidence_sources/);
 assert.match(source,/source_class='projection'/);
 assert.match(source,/owner_component='powerhouse-seo-opportunity-resolver'/);
 assert.match(source,/writer_contract='powerhouse-seo-opportunity-resolver-v1'/);
 assert.match(source,/EXECUTE v_after/);
 assert.match(source,/position\(v_old IN substring\(v_before/);
 const executable=source.replace(/^--.*$/gm,'');
 assert.doesNotMatch(executable,/\bcron\.schedule\s*\(|\bGRANT\b|\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
});

test('prevention stays attached to original SEO agent and skill, not a new scheduler',()=>{
 const a=readFileSync(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
 const s=readFileSync(new URL('../.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',import.meta.url),'utf8');
 assert.match(a,/verify-original-175-source-count-nine-and-brain-heartbeat-current-sha/);
 assert.match(s,/seo\|original-nine-source-count-fail-closed\|20261112-v1/);
});
