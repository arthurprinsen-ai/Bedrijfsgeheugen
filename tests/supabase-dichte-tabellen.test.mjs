import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * Acht tabellen stonden open voor iedereen met de publieke sleutel.
 *
 * Op 11 september 2026 gaf een GET met de sleutel uit de paginabron rijen terug
 * uit onder andere bg_tasks, met klantnamen erin. Row level security stond uit
 * en anon had volledige rechten. Deze test legt vast dat de migratie alle acht
 * dichtzet en dat er geen rechten terugkomen voor anon of authenticated.
 */

const DICHT = [
  'bg_ga4_sync', 'bg_buffer_sync', 'bg_buffer_ingest_status', 'bg_notion_sync',
  'notion_synced_posts', 'bg_notion_webhooks', 'bg_tasks', 'bg_post_kenmerken'
];

const sql = (await readFile(new URL('../supabase/migrations/20260911213000_dichte_tabellen_zonder_rls.sql', import.meta.url), 'utf8'))
  .replace(/--.*$/gm, '');

test('alle acht tabellen staan in de migratie', () => {
  for (const tabel of DICHT) assert.match(sql, new RegExp(`'${tabel}'`), tabel + ' ontbreekt');
});

test('row level security gaat aan en de rechten van anon gaan eraf', () => {
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.%I from anon, authenticated/);
});

test('de service-sleutel houdt toegang, want het brein schrijft deze tabellen', () => {
  assert.match(sql, /grant all on public\.%I to service_role/);
});

test('er komt geen enkel recht terug voor anon of authenticated', () => {
  const grants = sql.match(/grant[^;']*to[^;']*/gi) || [];
  for (const regel of grants) assert.doesNotMatch(regel, /\b(anon|authenticated)\b/, regel);
});

test('een tabel die niet meer bestaat laat de migratie niet omvallen', () => {
  assert.match(sql, /to_regclass\('public\.' \|\| t\) is null/);
});
