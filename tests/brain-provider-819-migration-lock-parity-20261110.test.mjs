import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sql=readdirSync(new URL('../supabase/migrations/',import.meta.url))
  .filter(x=>/^[0-9]{14}_[a-z0-9_]+[.]sql$/.test(x)).sort();

test('the original 819 observed provider identities remain an exact immutable prefix',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  const historical=lock.applied.filter(x=>x.version<='20261110073500');
  assert.equal(historical.length,819,'the original 819 were observed by this checkpoint');
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length,'all current provider identities must be unique');
  assert.equal(sql.length,lock.applied.length,'all current canonical SQL must match provider lock');
  assert.deepEqual(sql.map(x=>x.slice(0,-4)),lock.applied.map(x=>x.version+'_'+x.name));
  assert.deepEqual(historical.at(-1),{version:'20261110073500',name:'original_content_handoff_receipts_v1'});
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-10T08:19:43.617348Z'));
});

test('production-applied SQL is present in original source, but no new send/deploy is fabricated',()=>{
 const name='20261110073500_original_content_handoff_receipts_v1.sql';
 assert.ok(sql.includes(name));
 const content=readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
 assert.match(content,/powerhouse_content_handoff_receipts_v1/);
 assert.match(content,/TO service_role/);
 const record=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-10-provider-819-migration-lock-parity-v1.json',import.meta.url),'utf8'));
 assert.equal(record.evaluation.live_email_send_proven,false);
 assert.equal(record.evaluation.causal_revenue_uplift_proven,false);
});
