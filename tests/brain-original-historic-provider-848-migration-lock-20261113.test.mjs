import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const prior={version:'20261113153000',name:'original_no_publish_legacy_source_action_reconcile_v1'};
const exact={version:'20261113155800',name:'original_historic_handoff_source_revision_priority_v1'};
const sql=readFileSync(new URL('../supabase/migrations/20261113155800_original_historic_handoff_source_revision_priority_v1.sql',import.meta.url),'utf8');

test('real provider 848 exact source lock, unique and forward-compatible historical prefix',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=848);
 assert.deepEqual(lock.applied[846],prior);
 assert.deepEqual(lock.applied[847],exact);
 assert.equal(lock.applied.filter(x=>x.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T16:06:25.688069Z'));
 const hypothetical=[...lock.applied,{version:'20991231235959',name:'in_memory_only_future_append'}];
 assert.deepEqual(hypothetical[847],exact);
});
test('source migration 848 is a single original handoff function revision-first order without duplicate executor',()=>{
 assert.ok(existsSync(new URL('../supabase/migrations/20261113155800_original_historic_handoff_source_revision_priority_v1.sql',import.meta.url)));
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1\(/);
 assert.match(sql,/ORDER BY CASE WHEN \(/);
 assert.match(sql,/b\.evidence->>'source_revision' IS DISTINCT FROM/);
 assert.match(sql,/b\.evidence#>>'\{consumer_ack,source_revision\}' IS DISTINCT FROM/);
 assert.match(sql,/LIMIT 48/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role;/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|CREATE TABLE|DROP TRIGGER|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/i);
});
test('one real original terminal guard and no historical no-publish decision invented',()=>{
 const guard=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const m of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(guard.includes(m),m);
 const historical=readFileSync(new URL('../supabase/migrations/20261113153000_original_no_publish_legacy_source_action_reconcile_v1.sql',import.meta.url),'utf8');
 assert.match(historical,/NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE/);
 assert.doesNotMatch(historical,/set\s+evidence\s*=|set\s+status\s*=/i);
});
