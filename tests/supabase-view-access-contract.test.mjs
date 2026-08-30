import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);
const finalSql = (await readFile(new URL('../supabase/migrations/20260830_zz_view_access_contract.sql', import.meta.url), 'utf8'))
  .toLowerCase()
  .replace(/--.*$/gm, '');

const publicViews = ['gewijzigd_per_plek','kerncijfers_publiek','portaal_publiek','wijzigingen','wijzigingen_publiek'];
const authenticatedViews = ['laatste_bronwaarden','relevante_publicaties','te_beoordelen'];
const serverOnlyViews = ['prijsadvies','hergebruik_rendement'];

for (const view of [...publicViews, ...authenticatedViews, ...serverOnlyViews]) {
  test(`${view} is security invoker in final contract`, () => {
    assert.match(finalSql, new RegExp(`alter view public\\.${view} set \\(security_invoker = true\\)`));
  });
}

test('final contract grants SELECT only', () => {
  assert.doesNotMatch(finalSql, /grant[^;]*(insert|update|delete|truncate|trigger|references)/);
});

test('server-only intelligence is granted only to service_role', () => {
  const statements = finalSql.split(';').map(s => s.trim()).filter(Boolean);
  for (const view of serverOnlyViews) {
    const grants = statements.filter(s => s.startsWith('grant ') && s.includes(`public.${view}`));
    assert.equal(grants.length, 1, `${view} should have one final grant statement`);
    assert.match(grants[0], /to service_role$/);
    assert.doesNotMatch(grants[0], /\b(anon|authenticated)\b/);
  }
});

test('no migration can re-grant server-only intelligence to client roles', async () => {
  const files = (await readdir(migrationDir)).filter(name => name.endsWith('.sql'));
  for (const file of files) {
    const sql = (await readFile(new URL(file, migrationDir), 'utf8'))
      .toLowerCase()
      .replace(/--.*$/gm, '');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) {
      if (!statement.startsWith('grant ')) continue;
      if (!serverOnlyViews.some(view => statement.includes(`public.${view}`))) continue;
      assert.doesNotMatch(statement, /\bto\b[\s\S]*\b(anon|authenticated)\b/, `${file} reopens a server-only view`);
    }
  }
});
