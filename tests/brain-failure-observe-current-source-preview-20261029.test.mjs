import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql',import.meta.url),'utf8');
const guard=sql.slice(sql.indexOf('DO $guard$'),sql.indexOf('END $guard$;')+'END $guard$;'.length);
const post=sql.slice(sql.indexOf('-- Pure identity normalizer'));

test('guard requires actual known pre-repair OR verified canonical post-repair source before replay',()=>{
 assert.match(guard,/to_regprocedure\('public\.brain_observe_failure\(text,text,text,jsonb\)'\) IS NULL/);
 assert.match(guard,/position\('evidence=coalesce\(p_evidence,evidence\)' IN v_source\) > 0/);
 assert.match(guard,/position\('evidence=coalesce\(evidence,p_evidence\)' IN v_source\) > 0/);
 for(const marker of ['FAILURE_SEMANTIC_EVENT_CONFLICT','FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT','brain_failure_semantic_event_key','pg_advisory_xact_lock','SECURITY DEFINER','search_path'])
   assert.ok(guard.includes("position('"+marker+"' IN v_source) > 0"),marker);
 assert.match(guard,/THEN RAISE EXCEPTION 'BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT'/);
 assert.doesNotMatch(guard,/OR\s+TRUE\b|continue-on-error|SKIP_GUARD/i);
});
test('canonical replay requires least privilege in already-correct source branch',()=>{
 for(const role of ['anon','authenticated'])
   assert.ok(guard.includes("AND NOT has_function_privilege('"+role+"'"),role);
 assert.match(guard,/AND has_function_privilege\('service_role'/);
 assert.match(post,/REVOKE ALL ON FUNCTION public\.brain_observe_failure/);
 assert.match(post,/GRANT EXECUTE ON FUNCTION public\.brain_observe_failure[\s\S]*TO service_role/);
});
test('migration continues to preserve evidence and fail closed on alias collisions',()=>{
 assert.match(post,/evidence=coalesce\(evidence,p_evidence\)/);
 assert.match(post,/FAILURE_SEMANTIC_EVENT_CONFLICT/);
 assert.match(post,/FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT/);
 assert.match(post,/pg_advisory_xact_lock\(hashtextextended/);
 assert.match(sql,/SET LOCAL statement_timeout = '30s'/);
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/);
});
test('source drift of absent evidence tables remains a hard failure',()=>{
 assert.match(guard,/to_regclass\('public\.brain_failure_occurrences'\) IS NULL/);
 assert.match(guard,/to_regclass\('public\.brain_failure_registry'\) IS NULL/);
 assert.match(guard,/BRAIN_FAILURE_CANONICAL_TABLE_MISSING/);
});
