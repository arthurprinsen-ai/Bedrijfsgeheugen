import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113140500',name:'original_no_publish_immutable_provider_receipt_v1'};
const migrationPath='../supabase/migrations/'+exact.version+'_'+exact.name+'.sql';
const migration=readFileSync(new URL(migrationPath,import.meta.url),'utf8');

test('original applied Supabase provider migration 846 is present with exact name and preserved prior 845',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,846);
 assert.deepEqual(lock.applied.at(-1),exact);
 assert.deepEqual(lock.applied.at(-2),{version:'20261113132000',name:'original_skipped_no_publish_evidence_routing_v1'});
 assert.equal(lock.applied.filter(x=>x.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.equal(lock.captured_at,'2026-11-13T14:39:23.852565Z');
});

test('original provider-846 immutable source matches real protected executable SQL and no phantom version',()=>{
 assert.equal(existsSync(new URL(migrationPath,import.meta.url)),true);
 assert.match(migration,/CREATE OR REPLACE FUNCTION public\.record_content_publication_skip/);
 assert.match(migration,/public\.powerhouse_jsonb_true\(v_original_evidence,k\)\s+or public\.powerhouse_jsonb_true\(v_incoming_evidence,k\)/);
 assert.match(migration,/NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE/);
 assert.match(migration,/NO_PUBLISH_EXISTING_VETO_CANNOT_BE_DOWNGRADED/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.record_content_publication_skip\(text,date,text,text,jsonb\)/);
 assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.record_content_publication_skip\(text,date,text,text,jsonb\)\s+TO service_role;/);
 assert.doesNotMatch(migration,/cron\.schedule|net\.http_post|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/i);
});

test('exact original Brain terminal veto remains independently fail-closed after source lock update',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const name of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(sql.includes(name));
});
