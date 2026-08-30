import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const raw = (await readFile(new URL('../supabase/migrations/20260830_rls_policy_grant_alignment.sql', import.meta.url), 'utf8')).toLowerCase();
const sql = raw.replace(/--.*$/gm, '');

const mustContain = [
  /grant select on table[\s\S]*public\.blokgebruik[\s\S]*public\.blokversies[\s\S]*public\.portaalblokken[\s\S]*to anon, authenticated/,
  /grant select on table public\.organisaties to anon/,
  /grant select on table[\s\S]*public\.bronnen[\s\S]*public\.bronpublicaties[\s\S]*public\.uitnodigingen[\s\S]*to authenticated/,
  /grant select, update on table[\s\S]*public\.cijfervoorstellen[\s\S]*public\.organisaties[\s\S]*to authenticated/,
  /grant select, insert on table public\.logboek to authenticated/,
  /grant select, insert, update, delete on table[\s\S]*public\.klanten[\s\S]*public\.leden[\s\S]*public\.offertes[\s\S]*to authenticated/,
];

test('migration revokes broad client grants before restoring policy-scoped privileges', () => {
  assert.match(sql, /revoke all on table[\s\S]*public\.blokgebruik[\s\S]*public\.uitnodigingen[\s\S]*from anon, authenticated/);
});

test('restored grants match the existing RLS policy command groups', () => {
  for (const pattern of mustContain) assert.match(sql, pattern);
});

test('migration never grants non-policy privileges to client roles', () => {
  assert.doesNotMatch(sql, /grant[^;]*(truncate|references|trigger)[^;]*to (anon|authenticated)/);
});

test('service_role privileges are unchanged', () => {
  assert.doesNotMatch(sql, /(grant|revoke)[^;]*service_role/);
});
