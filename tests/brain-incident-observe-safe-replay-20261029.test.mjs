import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sql=readFileSync(new URL('../supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql',import.meta.url),'utf8');
const guard=sql.slice(sql.indexOf('DO $guard$'),sql.indexOf('END $guard$;')+'END $guard$;'.length);
const suffix=sql.slice(sql.indexOf('-- Pure identity normalizer; no new registry, scheduler, or consumer.'));

test('replayed legacy source is accepted only with its pre-existing evidence-update signature',()=>{
 assert.match(guard,/v_legacy\s*:=\s*position\('evidence=coalesce\(p_evidence,evidence\)' IN v_definition\) > 0/);
 assert.match(guard,/IF NOT \(v_legacy OR v_safe_postcondition\) THEN[\s\S]*BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT/);
});
test('already-correct, evidence-preserving function requires complete semantic identity, conflict and serialization proofs',()=>{
 const required=[
   'evidence=coalesce(evidence,p_evidence)',
   'FAILURE_SEMANTIC_EVENT_CONFLICT',
   'FAILURE_SEMANTIC_EVENT_LEGACY_CONFLICT',
   'pg_advisory_xact_lock',
   'brain_failure_semantic_event_key'
 ];
 for(const term of required)assert.ok(guard.includes("position('"+term+"' IN v_definition) > 0"),'Missing mandatory modern signature '+term);
 assert.match(guard,/AND NOT coalesce\(has_function_privilege\('anon',v_observe,'EXECUTE'\),true\)/);
 assert.match(guard,/AND NOT coalesce\(has_function_privilege\('authenticated',v_observe,'EXECUTE'\),true\)/);
 assert.match(guard,/AND coalesce\(has_function_privilege\('service_role',v_observe,'EXECUTE'\),false\)/);
});
test('missing baseline function, missing canonical tables and foreign bodies still fail closed',()=>{
 assert.match(guard,/IF v_observe IS NULL THEN[\s\S]*BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT/);
 assert.match(guard,/BRAIN_FAILURE_CANONICAL_TABLE_MISSING/);
 assert.match(guard,/to_regclass\('public\.brain_failure_occurrences'\)/);
 assert.match(guard,/to_regclass\('public\.brain_failure_registry'\)/);
 assert.doesNotMatch(guard,/\bDROP\s+TABLE\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
});
test('replay-only compatibility change never alters executable DDL or function implementation',()=>{
 const sha=createHash('sha256').update(suffix).digest('hex');
 assert.equal(sha,'972f35b0ec503e08a7267b3e2b05f2dda94842965af4e9370df1d0d47d76611a');
 assert.match(suffix,/evidence=coalesce\(evidence,p_evidence\)/);
 assert.match(suffix,/CREATE OR REPLACE FUNCTION public\.brain_observe_failure/);
});
