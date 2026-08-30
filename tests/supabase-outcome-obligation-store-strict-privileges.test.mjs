import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_brain_outcome_obligation_store_strict_privileges.sql';

test('outcome obligation store service_role is reduced to SELECT and INSERT only', async () => {
  const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
  for (const table of ['brain_outcome_obligation_dispatch', 'brain_outcome_obligation_evidence']) {
    assert.ok(sql.includes(`revoke all on table public.${table} from service_role`), `${table} must revoke all service_role privileges first`);
    assert.ok(sql.includes(`grant select, insert on table public.${table} to service_role`), `${table} must restore only select/insert`);
    for (const forbidden of ['update', 'delete', 'truncate', 'references', 'trigger']) {
      assert.equal(sql.includes(`grant ${forbidden} on table public.${table} to service_role`), false, `${table} must not grant ${forbidden}`);
    }
  }
});

test('strict privilege hardening does not expose client roles or weaken RLS', async () => {
  const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
  for (const forbidden of [
    'disable row level security',
    'grant select on table public.brain_outcome_obligation_dispatch to anon',
    'grant select on table public.brain_outcome_obligation_dispatch to authenticated',
    'grant select on table public.brain_outcome_obligation_evidence to anon',
    'grant select on table public.brain_outcome_obligation_evidence to authenticated',
  ]) assert.equal(sql.includes(forbidden), false, `${forbidden} must not be introduced`);
});
