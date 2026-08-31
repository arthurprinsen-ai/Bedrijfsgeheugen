import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_transactional_inbox_outbox.sql';

test('transactional inbox/outbox is durable, idempotent and claim/ack bounded',()=>{
  assert.equal(fs.existsSync(migration),true,'inbox/outbox migration must exist');
  const sql=fs.readFileSync(migration,'utf8');
  for(const required of [
    'brain_inbox','brain_outbox','message_id','operation_id',
    'brain_receive_inbox','brain_enqueue_outbox','brain_claim_outbox','brain_ack_outbox',
    'ON CONFLICT','FOR UPDATE SKIP LOCKED','DELIVERED','FAILED','security definer'
  ]) assert.match(sql,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`missing ${required}`);
  assert.match(sql,/references public\.brain_operations/i,'outbox must retain operation lineage');
  assert.match(sql,/revoke all on table public\.brain_inbox from public,anon,authenticated,service_role/i);
  assert.match(sql,/revoke all on table public\.brain_outbox from public,anon,authenticated,service_role/i);
});
