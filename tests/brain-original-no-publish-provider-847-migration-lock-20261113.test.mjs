import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113153000',name:'original_no_publish_legacy_source_action_reconcile_v1'};
const prior={version:'20261113140500',name:'original_no_publish_immutable_provider_receipt_v1'};
const path='../supabase/migrations/'+exact.version+'_'+exact.name+'.sql';
const sql=readFileSync(new URL(path,import.meta.url),'utf8');

test('original actual provider migration 847 appended exactly, with prior provider-846 immutable',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=847,'future real migrations may extend canonical lock without breaking historical 847');
 assert.deepEqual(lock.applied[846],exact,'actual 847 must remain at historical index 846');
 assert.deepEqual(lock.applied[845],prior,'real prior 846 must remain at historical index 845');
 assert.equal(lock.applied.filter(x=>x.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T15:38:43.911949Z'));
 const future=[...lock.applied,{version:'20991231235959',name:'simulation_only'}];
 assert.deepEqual(future[846],exact);
});

test('verified provider 847 source is the exact bounded no-send original data migration',()=>{
 assert.equal(existsSync(new URL(path,import.meta.url)),true);
 assert.match(sql,/DO \$original_source_action\$/);
 assert.match(sql,/v_count > 64/);
 assert.match(sql,/NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE/);
 assert.match(sql,/ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND/);
 assert.match(sql,/public\.powerhouse_jsonb_true\(p\.evidence,flag\.k\)/);
 for(const v of ['provider_create_success','provider_publication_ack_verified','provider_truth_verified','terminal_provider_side_effect','possible_provider_side_effect','reconciliation_required'])assert.ok(sql.includes(v),v);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|CREATE TABLE|CREATE TRIGGER|GRANT EXECUTE|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/i);
 assert.doesNotMatch(sql,/set\s+(?:status|evidence|external_id|published_at|live_proven_at|tenant_id|publication_date|channel)\s*=/i);
});

test('original hardened no-publish provider RPC and brain terminal proof guard remain protected',()=>{
 const rpc=readFileSync(new URL('../supabase/migrations/20261113140500_original_no_publish_immutable_provider_receipt_v1.sql',import.meta.url),'utf8');
 const trigger=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 assert.match(rpc,/NO_PUBLISH_EXISTING_VETO_CANNOT_BE_DOWNGRADED/);
 assert.match(rpc,/NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE/);
 for(const name of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(trigger.includes(name),name);
});
