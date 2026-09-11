import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * Een klant (rol 'lid') leest zijn offerte en tekent hem, maar wijzigt of wist
 * hem niet. Aanleiding 11 september 2026: offertes_alles en klanten_alles gaven
 * ieder lid FOR ALL, dus ook het bedrag en de status.
 *
 * Deze test bewaakt het migratiecontract. Het gedrag zelf is op 11 september
 * tegen productie gedraaid in een teruggedraaide transactie (zie de PR):
 * lid ziet 1 offerte, wijzigt/wist 0 rijen, tekent via offerte_akkoord, een
 * buitenstaander krijgt 'niet gevonden' en anon heeft geen uitvoerrecht.
 */
const raw = (await readFile(new URL('../supabase/migrations/20260911194500_offertes_leden_alleen_lezen_en_tekenfunctie.sql', import.meta.url), 'utf8')).toLowerCase();
const sql = raw.replace(/--.*$/gm, '');

for (const tabel of ['offertes', 'klanten']) {
  test(`${tabel}: het FOR ALL-beleid voor leden is weg`, () => {
    assert.match(sql, new RegExp(`drop policy if exists ${tabel}_alles on public\\.${tabel}`));
    assert.doesNotMatch(sql, new RegExp(`create policy[^;]*on public\\.${tabel}[^;]*for all`));
  });

  test(`${tabel}: leden lezen alleen binnen hun eigen organisatie`, () => {
    assert.match(sql, new RegExp(`on public\\.${tabel}\\s+for select to authenticated\\s+using \\(organisatie_id in \\(select intern\\.mijn_organisaties\\(\\)\\)\\)`));
  });

  test(`${tabel}: toevoegen, wijzigen en wissen alleen door de eigenaar`, () => {
    for (const cmd of ['insert', 'update', 'delete']) {
      assert.match(sql, new RegExp(`on public\\.${tabel}\\s+for ${cmd} to authenticated[^;]*intern\\.is_eigenaar\\(organisatie_id\\)`),
        `${cmd} op ${tabel} moet op is_eigenaar staan`);
    }
  });
}

test('tekenen loopt via een private definer-functie met een publieke invoker-wrapper', () => {
  assert.match(sql, /function private\.offerte_akkoord\([^)]*\)[\s\S]*?security definer[\s\S]*?set search_path = ''/);
  assert.match(sql, /function public\.offerte_akkoord\([^)]*\)[\s\S]*?security invoker[\s\S]*?select \* from private\.offerte_akkoord\(/);
});

test('de tekenfunctie is niet aan te roepen door anon of public', () => {
  for (const schema of ['private', 'public']) {
    assert.match(sql, new RegExp(`revoke all on function ${schema}\\.offerte_akkoord\\(uuid, text, text\\) from public, anon`));
    assert.match(sql, new RegExp(`grant execute on function ${schema}\\.offerte_akkoord\\(uuid, text, text\\) to authenticated, service_role`));
  }
});

test('tekenen kan alleen door een lid, vanaf verstuurd en binnen de geldigheid', () => {
  assert.match(sql, /from public\.leden l\s+where l\.gebruiker_id = v_uid and l\.organisatie_id = v\.organisatie_id/);
  assert.match(sql, /if v\.status <> 'verstuurd' then/);
  assert.match(sql, /v\.geldig_tot < \(now\(\) at time zone 'europe\/amsterdam'\)::date/);
  assert.match(sql, /set status = 'geaccepteerd'/);
  assert.match(sql, /'offerte_getekend'/);
});
