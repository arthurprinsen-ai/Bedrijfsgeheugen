import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const actual={version:'20261113132000',name:'original_skipped_no_publish_evidence_routing_v1'};
const path='../supabase/migrations/'+actual.version+'_'+actual.name+'.sql';
const sql=readFileSync(new URL(path,import.meta.url),'utf8');

test('exact original provider-applied migration 845 is the sole appended lock identity',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,845);
 assert.deepEqual(lock.applied.at(-1),actual);
 assert.deepEqual(lock.applied.at(-2),{version:'20261113121500',name:'original_ga4_handoff_json_operator_precedence_v1'});
 assert.equal(lock.applied.filter(x=>x.version===actual.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,845);
 assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
 assert.equal(lock.captured_at,'2026-11-13T13:12:15.617685Z');
});

test('provider-applied 845th identity maps to the single canonical original executable migration',()=>{
 assert.equal(existsSync(new URL(path,import.meta.url)),true);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(sql,/ELSIF NOT v_pub AND r.status='SKIPPED' THEN/);
 assert.match(sql,/OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF/);
 assert.match(sql,/ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role;/);
 assert.doesNotMatch(sql,/\bCREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER|cron\.schedule|net\.http_post/i);
});

test('original terminal guard and anti-duplicate publishing stay protected by original migration chain',()=>{
 const guard=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const marker of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])
  assert.ok(guard.includes(marker),marker);
 assert.match(sql,/WHEN v_no_publish THEN 'CANCELLED'/);
 assert.match(sql,/publication_side_effect_must_not_repeat/);
 assert.match(sql,/OVERDUE_PROVIDER_READBACK/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+FROM PUBLIC,anon,authenticated;/);
});
