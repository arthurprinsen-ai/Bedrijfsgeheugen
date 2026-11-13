import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113164000',name:'original_seo_one_chain_outcome_assurance_v2'};
const preceding={version:'20261113155800',name:'original_historic_handoff_source_revision_priority_v1'};
const target=new URL('../supabase/migrations/'+exact.version+'_'+exact.name+'.sql',import.meta.url);
const sql=readFileSync(target,'utf8');

test('original provider 849 is appended after exact 848 source identities once',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=849);
  assert.deepEqual(lock.applied[848],exact);
  assert.deepEqual(lock.applied[847],preceding);
  assert.equal(lock.applied.filter(r=>r.version===exact.version).length,1);
  assert.equal(new Set(lock.applied.map(r=>r.version)).size,lock.applied.length);
  assert.ok(lock.applied.every((r,i)=>i===0||r.version>lock.applied[i-1].version));
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T17:07:59.213504Z'));
});

test('849 only records already provider-applied original SQL; no replay or duplicate process',()=>{
  assert.equal(existsSync(target),true);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_refresh_seo_assurance_v1/);
  assert.match(sql,/powerhouse-seo-opportunity-resolver-v2-exact-original-handoff/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_refresh_seo_assurance_v1\(timestamptz\)/);
  assert.match(sql,/consumer_ack_exact/);
  assert.match(sql,/learning_next_run_proven/);
  assert.doesNotMatch(sql,/\bcron\.schedule\b|\bnet\.http_post\b|\bCREATE\s+TABLE\b/i);
});

test('source lock cannot certify CRO execution or provider outcomes by itself',()=>{
  const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-provider-849-migration-lock-v1.json',import.meta.url),'utf8'));
  assert.equal(learning.production_success,false);
  assert.equal(learning.safety.no_provider_sql_replay,true);
  assert.equal(learning.safety.no_new_scheduler,true);
  assert.match(learning.prevention_rule,/provider/i);
  assert.match(learning.root_cause,/848/);
});
