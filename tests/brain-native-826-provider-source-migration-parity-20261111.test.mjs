import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const original=readFileSync(new URL('../supabase/migrations/20261111093500_original_loop_assurance_fault_isolation_v1.sql',import.meta.url),'utf8');
const providerMirror=readFileSync(new URL('../supabase/migrations/20261111094222_original_loop_assurance_fault_isolation_v1.sql',import.meta.url),'utf8');
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const key=(x)=>x.version+'|'+x.name;
const sameName='original_loop_assurance_fault_isolation_v1';

test('historical provider migration lock keeps both immutable native versions and no duplicates',()=>{
 const pairs=lock.applied.map(key);
 assert.equal(new Set(pairs).size,pairs.length);
 const matches=lock.applied.filter(x=>x.name===sameName);
 // Proposed SQL must NOT be predeclared applied in a candidate PR.
 // After a separate provider-authoritative lock correction, both entries
 // must be present atomically and in the genuine version order.
 assert.equal(matches.length,2,'both exact native provider versions must be registered after source merge');
 assert.deepEqual(matches.map(x=>x.version),['20261111093500','20261111094222'].slice(0,matches.length));
 if(matches.length===2){
  assert.deepEqual(matches.map(x=>x.version),['20261111093500','20261111094222']);
  const a=lock.applied.findIndex(x=>x.version==='20261111093500');
  const b=lock.applied.findIndex(x=>x.version==='20261111094222');
  assert.equal(a,824,'prior 824 native historical rows must remain immutable');
  assert.equal(b,a+1,'second true native provider version follows first');
 }
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
});

test('native second applied SQL is exact source mirror and preserves one original recovery owner',()=>{
 assert.equal(providerMirror,original);
 assert.match(original,/CREATE OR REPLACE FUNCTION public\.powerhouse_refresh_loop_assurance_v1/);
 assert.match(original,/v_receipt_sync_failure_sqlstate/);
 assert.match(original,/v_content_handoff_failure_sqlstate/);
 assert.match(original,/EXCEPTION WHEN OTHERS/);
 assert.match(original,/GRANT EXECUTE ON FUNCTION public\.powerhouse_refresh_loop_assurance_v1\(timestamptz\)/);
 assert.doesNotMatch(original,/cron\.schedule|create\s+table|delete\s+from\s+supabase_migrations|net\.http_post/i);
});

test('original continuity skill preserves provider-actual first and no fictitious receipt closure',()=>{
 const skill=readFileSync(new URL('../.agents/skills/powerhouse-continuity/SKILL.md',import.meta.url),'utf8');
 const rule='powerhouse|migration|native-second-version-source-lock-drift|20261111-v1';
 assert.ok(skill.includes(rule));
 for(const term of ['20261111093500','20261111094222','826','exact provider source','no second scheduler','EVIDENCE_DUE']){
   assert.ok(skill.toLowerCase().includes(term.toLowerCase()),term);
 }
});
