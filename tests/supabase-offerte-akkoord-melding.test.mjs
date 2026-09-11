import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * Een getekende offerte moet in Vandaag verschijnen, zonder Make (besluit
 * 10 september 2026). Vandaag leest powerhouse_sales_actions met status
 * 'suggested'. Het gedrag is op 11 september tegen productie gedraaid in een
 * teruggedraaide transactie (zie de PR).
 */
const raw = (await readFile(new URL('../supabase/migrations/20260911201500_offerte_akkoord_melding_in_vandaag.sql', import.meta.url), 'utf8')).toLowerCase();
const sql = raw.replace(/--.*$/gm, '');

test('tekenen zet een actie klaar die Vandaag toont', () => {
  assert.match(sql, /insert into public\.powerhouse_sales_actions/);
  assert.match(sql, /'offerte_getekend'/);
  assert.match(sql, /'suggested'/);
});

test('nogmaals tekenen maakt geen tweede actie', () => {
  assert.match(sql, /'offerte_getekend:' \|\| v\.id::text/);
  assert.match(sql, /on conflict \(dedupe_key\) do nothing/);
});

test('een mislukte melding draait de handtekening niet terug maar wordt gelogd', () => {
  assert.match(sql, /exception when others then\s+insert into public\.logboek[\s\S]*'melding_mislukt'/);
});

test('de rechten van de tekenfunctie blijven dicht voor anon en public', () => {
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all on function private\.offerte_akkoord\(uuid, text, text\) from public, anon/);
  assert.doesNotMatch(sql, /grant[^;]*offerte_akkoord[^;]*to[^;]*anon/);
});

test('de eerdere regels voor tekenen staan er nog in', () => {
  assert.match(sql, /if v\.status <> 'verstuurd' then/);
  assert.match(sql, /v\.geldig_tot < \(now\(\) at time zone 'europe\/amsterdam'\)::date/);
  assert.match(sql, /from public\.leden l\s+where l\.gebruiker_id = v_uid and l\.organisatie_id = v\.organisatie_id/);
});
