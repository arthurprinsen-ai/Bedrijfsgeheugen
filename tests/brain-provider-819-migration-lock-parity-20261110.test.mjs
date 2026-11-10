import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sql=readdirSync(new URL('../supabase/migrations/',import.meta.url))
  .filter(x=>/^\\d{14}_[a-z0-9_]+\\.sql$/.test(x)).sort();

test('immutable original source lock contains exactly 819 independently provider observed identities',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.applied.length,819);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,819);
  assert.equal(sql.length,819);
  assert.deepEqual(sql.map(x=>x.slice(0,-4)),lock.applied.map(x=>x.version+'_'+x.name));
  assert.deepEqual(lock.applied.at(-1),{version:'20261110073500',name:'original_content_handoff_receipts_v1'});
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
