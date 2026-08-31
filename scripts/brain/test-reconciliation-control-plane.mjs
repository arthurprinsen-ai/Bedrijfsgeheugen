import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration='supabase/migrations/20260831_brain_supporting_control_plane.sql';
test('reconciliation is durable, leased, bounded and no-progress aware',()=>{
  assert.equal(fs.existsSync(migration),true,'supporting control plane migration must exist');
  const sql=fs.readFileSync(migration,'utf8');
  for(const x of ['brain_reconciliation_jobs','brain_schedule_reconciliation','brain_claim_reconciliation','brain_record_reconciliation','NO_PROGRESS','ESCALATED','for update skip locked','max_attempts']) assert.match(sql,new RegExp(x,'i'),`missing ${x}`);
});
