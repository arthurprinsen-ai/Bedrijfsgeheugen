import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sql=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(x=>/^[0-9]{14}_[a-z0-9_]+[.]sql$/.test(x)).sort();
test('original native 821st provider identity remains immutable while future migrations grow',()=>{
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.ok(lock.applied.length>=821);
  assert.equal(sql.length,lock.applied.length,'source and verified provider lock must have equal cardinality');
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.deepEqual(sql.map(x=>x.slice(0,-4)),lock.applied.map(x=>x.version+'_'+x.name));
  assert.deepEqual(lock.applied[820],{version:'20261110123000',name:'original_content_handoff_no_aging_gap_v2'});
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-10T09:24:44.056132Z'));
});
test('821st migration is original no-age-gap code and never sender or publication replay',()=>{
  const s=readFileSync(new URL('../supabase/migrations/20261110123000_original_content_handoff_no_aging_gap_v2.sql',import.meta.url),'utf8');
  assert.match(s,/powerhouse_content_handoff_receipts_v1/);
  assert.match(s,/social_learning_obligations/);
  assert.doesNotMatch(s,/create\s+extension\s+http/i);
  const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-10-native821-provider-lock-v1.json',import.meta.url),'utf8'));
  assert.equal(learning.terminal_rule.includes('provider-readback'),true);
});
