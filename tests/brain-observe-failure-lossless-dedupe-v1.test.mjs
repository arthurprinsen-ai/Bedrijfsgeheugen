import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='supabase/migrations/20261022172430_brain_observe_failure_lossless_dedupe.sql';
const sql=readFileSync(path,'utf8');

function normalizeForThisProject(id){
 let m=/^cron-(\d+):(\d+)$/.exec(id)
   || /^supabase:cron:job(\d+):run:(\d+)$/.exec(id)
   || /^supabase:adhjwmvyoixzjtmiroln:cron:(\d+):run:(\d+)$/.exec(id);
 return m ? `supabase:adhjwmvyoixzjtmiroln:cron:${m[1]}:run:${m[2]}` : id;
}

test('known cron aliases map to one actual provider event, other projects are distinct',()=>{
 for(const id of ['cron-46:121040','supabase:cron:job46:run:121040','supabase:adhjwmvyoixzjtmiroln:cron:46:run:121040']){
   assert.equal(normalizeForThisProject(id),'supabase:adhjwmvyoixzjtmiroln:cron:46:run:121040');
 }
 assert.equal(normalizeForThisProject('supabase:anotherprojectref0001:cron:46:run:121040'),
 'supabase:anotherprojectref0001:cron:46:run:121040');
 assert.notEqual(normalizeForThisProject('cron-46:121041'),normalizeForThisProject('cron-46:121040'));
});

test('immutable normalized event identity is guarded by transaction-scoped lock and hash conflict',()=>{
 assert.match(sql,/pg_advisory_xact_lock\(hashtextextended\('brain-failure-event:'\|\|v_canonical,0\)\)/);
 assert.match(sql,/v_aliases:=ARRAY\[/);
 assert.match(sql,/count\(DISTINCT fingerprint\),count\(DISTINCT payload_sha256\)/);
 assert.match(sql,/FAILURE_OCCURRENCE_ALIAS_HASH_CONFLICT/);
 assert.match(sql,/WHERE occurrence_id=ANY\(v_aliases\)/);
 assert.match(sql,/VALUES\(v_canonical,v_fingerprint,v_sha,p_evidence\)/);
 assert.doesNotMatch(sql,/DELETE\s+FROM\s+public\.brain_failure_occurrences/i);
});

test('subsequent observations retain promoted evidence and append immutable raw pointers',()=>{
 assert.doesNotMatch(sql,/evidence=coalesce\(p_evidence,evidence\)\s+where/i);
 assert.match(sql,/\|\| jsonb_build_object\('_event_observations_v1'/);
 assert.match(sql,/coalesce\(evidence,'\{\}'::jsonb\)/);
 assert.match(sql,/jsonb_build_array\(jsonb_build_object\(/);
 assert.match(sql,/FROM public\.brain_failure_occurrences/);
 assert.match(sql,/BRAIN_OBSERVE_RESERVED_EVIDENCE_KEY/);
 assert.match(sql,/occurrence_count=occurrence_count\+1/);
});

test('existing BRAIN security definer, fail-closed source, ACL and transaction preserved',()=>{
 assert.match(sql,/BEGIN;/);
 assert.match(sql,/SET LOCAL lock_timeout='2s'/);
 assert.match(sql,/BRAIN_OBSERVE_SOURCE_DRIFT_STOP/);
 assert.match(sql,/SECURITY DEFINER\s+SET search_path TO 'public'/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.brain_observe_failure\(text,text,text,jsonb\)/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.brain_observe_failure\(text,text,text,jsonb\)\s+TO service_role/);
 assert.match(sql,/BRAIN_OBSERVE_BROWSER_EXECUTE_FORBIDDEN/);
 assert.match(sql,/COMMIT;/);
});
