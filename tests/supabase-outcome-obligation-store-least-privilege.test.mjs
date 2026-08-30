import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_brain_outcome_obligation_store_least_privilege.sql';

test('outcome obligation runtime tables revoke service_role mutation beyond append-only insert', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const table of ['brain_outcome_obligation_dispatch', 'brain_outcome_obligation_evidence']) {
    assert.ok(sql.includes(`revoke update, delete on table public.${table} from service_role`), `${table} must explicitly revoke update/delete`);
    assert.ok(sql.includes(`grant select, insert on table public.${table} to service_role`), `${table} must retain select/insert`);
  }
});

test('least-privilege follow-up does not weaken append-only triggers or client isolation', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const forbidden of [
    'grant update',
    'grant delete',
    'grant all',
    'disable row level security',
    'grant select on table public.brain_outcome_obligation_dispatch to anon',
    'grant select on table public.brain_outcome_obligation_evidence to anon',
    'grant select on table public.brain_outcome_obligation_dispatch to authenticated',
    'grant select on table public.brain_outcome_obligation_evidence to authenticated',
  ]) assert.equal(sql.toLowerCase().includes(forbidden), false, `${forbidden} must not be introduced`);
});
