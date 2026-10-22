import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261022092300_personal_distinct_source_reserve_v1.sql','utf8');
const edge=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');

test('canonical materializer seeds distinct founder stories before decisions',()=>{
 assert.match(edge,/powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(edge,/powerhouse_seed_verified_personal_reserve_v1/);
 assert.ok(edge.indexOf("await db.rpc('powerhouse_seed_verified_personal_reserve_v1'") <
           edge.indexOf("stage = 'load-context'"));
 assert.match(edge,/recoverableObligationUniquenessDenial/);
 assert.match(edge,/rejected_recommendation_ids/);
 assert.match(edge,/validPersonalSource\(personalSource\)/);
});
test('source reserve is fact-bound and cannot publish, send or declare proof',()=>{
 assert.match(sql,/security invoker/i);
 assert.match(sql,/set search_path to 'pg_catalog'/i);
 assert.match(sql,/grant execute on function public\.powerhouse_seed_verified_personal_reserve_v1\(date\)\s+to service_role/i);
 assert.match(sql,/revoke execute on function public\.powerhouse_seed_verified_personal_reserve_v1\(date\)\s+from public,anon,authenticated/i);
 assert.match(sql,/NO_VERIFIED_BASE_SOURCE/);
 assert.match(sql,/event_id is not null/);
 assert.match(sql,/event_type in \(/);
 assert.match(sql,/evidence <> '\{\}'::jsonb/);
 assert.match(sql,/on conflict \(dedupe_key\) do nothing/);
 assert.match(sql,/source_family_verification/);
 assert.match(sql,/provider_outcome_unproven/);
 assert.doesNotMatch(sql,/\bupdate\s+public\.content_publication_obligations\b/i);
 assert.doesNotMatch(sql,/\binsert\s+into\s+public\.powerhouse_channel_decisions\b/i);
});
test('bounded number of distinct source families with non-duplicate content keys',()=>{
 const match=sql.match(/when '(external_intelligence_universe_refresh|commercial_learning_cycle|source_health_evaluated)'/g)||[];
 assert.equal(match.length,3);
 assert.match(sql,/if scoped_count >= 3 then exit/);
 assert.match(sql,/'founder-proof-reserve:'\|\|p_date::text\|\|':'\|\|event_row\.event_type/);
 assert.match(sql,/100-scoped_count/);
});
