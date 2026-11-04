import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeBrainRecordsStore } from '../tools/growth-intelligence/brain-records-store.mjs';
import { makeGrowthLearningEngine } from '../tools/growth-intelligence/learning-store.mjs';

const fakeClient = ({ rpc, row } = {}) => ({
  rpc: async (name, args) => rpc(name, args),
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row ?? null, error: null }) }) }) }) }),
});

test('adapter geeft het databaseantwoord ongewijzigd door en gebruikt de fence-functie', async () => {
  let seen;
  const store = makeBrainRecordsStore(fakeClient({ rpc: (name, args) => { seen = { name, args }; return { data: { status: 'INSERTED', epoch: '2', scope: args.p_scope, key: args.p_key, legacyKey: args.p_legacy_key, transactionVerified: true }, error: null }; } }));
  const out = await makeGrowthLearningEngine(store).recordOutcome({ actionId: 'a', evidenceId: 'e', result: 'WIN' });
  assert.equal(out.status, 'RECORDED');
  assert.equal(seen.name, 'growth_insert_if_absent_with_cutover_fence');
  assert.equal(seen.args.p_scope, 'growth:outcome');
});

test('een databasefout (fence niet actief) wordt nooit als succes gelezen', async () => {
  const store = makeBrainRecordsStore(fakeClient({ rpc: () => ({ data: null, error: { message: 'CUTOVER_FENCE_INACTIVE' } }) }));
  await assert.rejects(() => makeGrowthLearningEngine(store).recordOutcome({ actionId: 'a', evidenceId: 'e', result: 'WIN' }), /BRAIN_RECORDS_FENCE_REJECTED:CUTOVER_FENCE_INACTIVE/);
});

test('get pakt het record uit de payload en geeft undefined als het ontbreekt', async () => {
  assert.deepEqual(await makeBrainRecordsStore(fakeClient({ row: { payload: { record: { result: 'WIN' } } } })).get('k'), { result: 'WIN' });
  assert.equal(await makeBrainRecordsStore(fakeClient({})).get('k'), undefined);
});

test('de migratie houdt de fence dicht: vaste search_path, alleen service_role, geen nieuwe tabel', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261028220000_growth_atomic_cutover_fence_v1.sql', import.meta.url), 'utf8');
  assert.match(sql, /security definer\s+set search_path = ''/i);
  assert.match(sql, /revoke all on function public\.growth_insert_if_absent_with_cutover_fence[^;]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.growth_insert_if_absent_with_cutover_fence[^;]*to service_role/i);
  assert.match(sql, /for share/i);
  assert.match(sql, /for update/i);
  assert.doesNotMatch(sql, /create table/i);
});
