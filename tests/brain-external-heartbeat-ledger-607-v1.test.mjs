import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync('supabase/migrations/20261007091140_restore_single_staggered_commercial_heartbeat_owner.sql','utf8');
const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
const runner=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');

test('production migration 607 is represented exactly once in the local ledger',()=>{
  const rows=lock.applied.filter(x=>x.version==='20261007091140');
  assert.equal(rows.length,1);
  assert.equal(rows[0].name,'restore_single_staggered_commercial_heartbeat_owner');
  assert.equal(lock.applied.length,607);
});

test('607 replay converges away from the emergency legacy pg_cron owner',()=>{
  assert.match(migration,/cron\.unschedule/);
  assert.match(migration,/powerhouse-one-commercial-heartbeat-v1/);
  assert.match(migration,/powerhouse_commercial_heartbeat_v1/);
  assert.doesNotMatch(migration,/cron\.schedule\s*\(/);
});

test('canonical heartbeat authority remains external Edge with transaction-local marker',()=>{
  assert.match(runner,/powerhouse\.external_heartbeat_owner/);
  assert.match(runner,/netlify-supabase-edge-v1/);
  assert.match(runner,/supavisor-ipv4-transaction/);
  assert.match(runner,/durable_readback_verified:true/);
});
