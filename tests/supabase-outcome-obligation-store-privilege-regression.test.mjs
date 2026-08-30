import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = 'supabase/migrations/20260830_brain_outcome_obligation_store_strict_privileges.sql';

test('strict privilege migration strips all service_role table privileges before restoring append-only access', async () => {
  const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
  for (const table of ['brain_outcome_obligation_dispatch', 'brain_outcome_obligation_evidence']) {
    assert.ok(sql.includes(`revoke all on table public.${table} from service_role`), `${table} must revoke all privileges including truncate/trigger/references`);
    assert.ok(sql.includes(`grant select, insert on table public.${table} to service_role`), `${table} must restore only select/insert`);
  }
});

test('strict privilege migration never grants truncate trigger references update or delete', async () => {
  const sql = (await readFile(migrationPath, 'utf8')).toLowerCase();
  for (const forbidden of ['grant truncate', 'grant trigger', 'grant references', 'grant update', 'grant delete', 'grant all']) {
    assert.equal(sql.includes(forbidden), false, `${forbidden} must not be present`);
  }
});
