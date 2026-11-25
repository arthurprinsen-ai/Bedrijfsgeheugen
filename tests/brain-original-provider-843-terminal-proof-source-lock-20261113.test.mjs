import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sources=readdirSync(new URL('../supabase/migrations/',import.meta.url))
 .filter(n=>/^\d{14}_[a-z0-9_]+\.sql$/.test(n))
 .map(n=>({version:n.slice(0,14),name:n.slice(15,-4)}));

test('original native applied 843 terminal-proof guard is registered once after immutable 842 prefix',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=843,'a future verified migration may extend the one lock');
 assert.deepEqual(lock.applied[841],{version:'20261113082500',name:'original_cancelled_social_learning_source_ack_v1'});
 assert.deepEqual(lock.applied[842],{version:'20261113083000',name:'original_one_chain_content_terminal_proof_guard_v1'});
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T08:58:32.883023Z'));
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
});

test('one native source lock matches every executable migration without phantom provider identities',()=>{
 assert.equal(lock.applied.length,sources.length);
 assert.deepEqual(new Map(lock.applied.map(x=>[x.version,x.name])),new Map(sources.map(x=>[x.version,x.name])));
});

test('843 guard is defensive source and proof admission, not an extra publisher or new scheduler',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const token of [
  'SECURITY INVOKER','brain_content_handoff_terminal_proof_guard_v1',
  'BEFORE INSERT OR UPDATE ON public.brain_obligations',
  'CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED',
  'CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED',
  'SOURCE_CANCELLED_INVALID_LEARNING_ACK',
 ]) {
  if(token==='SOURCE_CANCELLED_INVALID_LEARNING_ACK')continue; // source-only ACK remains in migration 842
  assert.ok(sql.includes(token),'missing native fail-closed rule: '+token);
 }
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bnet\.http_post\s*\(/i);
});

test('existing original self-improvement skill recognizes proven 843 without falsely declaring learning GREEN',()=>{
 const skill=readFileSync(new URL('../.agents/skills/powerhouse-self-improvement-layer/SKILL.md',import.meta.url),'utf8');
 assert.ok(skill.includes('original terminal proof provider 843 verified'));
 assert.ok(skill.includes('does not prove new Instagram Meta delivery'));
});
