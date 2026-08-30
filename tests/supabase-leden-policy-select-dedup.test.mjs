import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../supabase/migrations/20260830_leden_policy_select_dedup.sql', import.meta.url), 'utf8')).replace(/--.*$/gm, '').toLowerCase();

test('legacy ALL policy is removed', () => {
  assert.match(sql, /drop\s+policy\s+if\s+exists\s+leden_beheren\s+on\s+public\.leden/);
  assert.doesNotMatch(sql, /create\s+policy\s+leden_beheren/);
});

test('owner management is write-only', () => {
  assert.match(sql, /create\s+policy\s+leden_toevoegen[\s\S]*?for\s+insert\s+to\s+authenticated[\s\S]*?with\s+check\s*\(intern\.is_eigenaar\(organisatie_id\)\)/);
  assert.match(sql, /create\s+policy\s+leden_wijzigen[\s\S]*?for\s+update\s+to\s+authenticated[\s\S]*?using\s*\(intern\.is_eigenaar\(organisatie_id\)\)[\s\S]*?with\s+check\s*\(intern\.is_eigenaar\(organisatie_id\)\)/);
  assert.match(sql, /create\s+policy\s+leden_verwijderen[\s\S]*?for\s+delete\s+to\s+authenticated[\s\S]*?using\s*\(intern\.is_eigenaar\(organisatie_id\)\)/);
  assert.doesNotMatch(sql, /for\s+select/);
  assert.doesNotMatch(sql, /for\s+all/);
});

test('existing leden_lezen select policy is not replaced', () => {
  assert.doesNotMatch(sql, /drop\s+policy[^;]*leden_lezen/);
  assert.doesNotMatch(sql, /create\s+policy[^;]*leden_lezen/);
});
