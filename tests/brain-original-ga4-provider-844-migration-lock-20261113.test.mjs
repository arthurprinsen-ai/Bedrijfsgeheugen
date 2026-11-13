import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113121500',name:'original_ga4_handoff_json_operator_precedence_v1'};
const migrationPath='../supabase/migrations/'+exact.version+'_'+exact.name+'.sql';
const migration=readFileSync(new URL(migrationPath,import.meta.url),'utf8');

test('original provider-readback 844 source lock has exactly one applied version and correct canonical source identity',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,844);
 assert.deepEqual(lock.applied.at(-1),exact);
 assert.equal(lock.applied.filter(z=>z.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(z=>z.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((z,i)=>i===0||z.version>lock.applied[i-1].version));
 assert.deepEqual(lock.applied.at(-2),{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'});
 assert.equal(lock.captured_at,'2026-11-13T12:33:20.358846Z');
});

test('each immutable provider-applied identity resolves to exactly one original executable migration',()=>{
 assert.equal(existsSync(new URL(migrationPath,import.meta.url)),true);
 assert.match(migration,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(migration,/v_event:='ga4:'\|\|\(r\.metrics->>'window_start'\)\|\|':'\|\|\(r\.metrics->>'window_end'\);/);
 assert.match(migration,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role;/);
 assert.doesNotMatch(migration,/v_event:='ga4:'\|\|r\.metrics->>/);
});

test('lock updates never weaken installed original BRAIN terminal-proof guard or add parallel SQL execution',()=>{
 const guard=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const marker of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])
   assert.ok(guard.includes(marker),'lost original BRAIN terminal marker: '+marker);
 assert.doesNotMatch(migration,/\bCREATE\s+TRIGGER|net\.http_post|cron\.schedule|LINKEDIN_CREATE_LINKED_IN_POST/i);
});
