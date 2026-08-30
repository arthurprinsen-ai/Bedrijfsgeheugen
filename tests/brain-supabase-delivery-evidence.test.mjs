import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));

async function migration() {
  return readFile(new URL('../supabase/migrations/20260830_brain_delivery_evidence.sql', import.meta.url), 'utf8');
}

test('Supabase schema changes are classified into the backend delivery lane', () => {
  const plan = createDeliveryPlan({
    changedPaths: ['supabase/migrations/20260830_brain_delivery_evidence.sql'],
    headSha: 'a'.repeat(40),
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend']);
  assert.ok(plan.conflictContracts.includes('supabase-schema'));
});

test('delivery evidence schema is append-only and idempotency-keyed', async () => {
  const sql = await migration();
  assert.match(sql, /create table if not exists public\.brain_delivery_evidence/i);
  assert.match(sql, /idempotency_key\s+text\s+not null\s+unique/i);
  assert.match(sql, /change_id\s+text\s+not null/i);
  assert.match(sql, /target\s+text\s+not null/i);
  assert.match(sql, /status\s+text\s+not null/i);
  assert.match(sql, /error_class/i);
  assert.match(sql, /remote_ref/i);
  assert.match(sql, /created_at\s+timestamptz\s+not null\s+default\s+now\(\)/i);
  assert.doesNotMatch(sql, /create policy[^;]*(insert|update|delete)[^;]*to\s+(anon|authenticated)/i);
});

test('evidence table enables RLS and forbids mutation of existing evidence', async () => {
  const sql = await migration();
  assert.match(sql, /alter table public\.brain_delivery_evidence enable row level security/i);
  assert.match(sql, /create or replace function public\.brain_delivery_evidence_immutable/i);
  assert.match(sql, /before update or delete on public\.brain_delivery_evidence/i);
  assert.match(sql, /raise exception 'brain_delivery_evidence is append-only'/i);
});
