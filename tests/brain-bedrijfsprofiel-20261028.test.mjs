import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// bg-bedrijfsprofiel haalt een zakelijk profiel uit de eigen website van een bedrijf.
// Deze guards leggen de grenzen vast: governance eerst, alleen zakelijke gegevens, geen eenmanszaken,
// begrensde looptijd, zichtbaar alarm bij nul opbrengst, en een service-only tabel zonder cron in dezelfde migratie.
const fn=readFileSync(new URL('../supabase/functions/bg-bedrijfsprofiel/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261028230000_bg_bedrijfsprofiel_v1.sql',import.meta.url),'utf8');

test('de governance-poort staat voor elke externe aanroep',()=>{
  const poort=fn.indexOf('AI_USE_CASE_NOT_APPROVED');
  const extern=fn.indexOf('api.tavily.com');
  assert.ok(poort>0&&extern>0&&poort<extern);
});

test('alleen algemene bedrijfsgegevens worden bewaard, gekoppeld aan het eigen domein',()=>{
  assert.ok(fn.includes('const ALGEMEEN ='));
  assert.ok(fn.includes('info|contact'));
  assert.ok(fn.includes("mail.endsWith('@' + dom)"));
  assert.ok(fn.includes('alles.includes(mail)'));
  for(const verboden of ['woonadres','geboortedatum','privemail','mobiel_prive','persoon_email']) assert.ok(!fn.includes(verboden),verboden);
});

test('eenmanszaken en zzp worden niet gecontroleerd op contactgegevens',()=>{
  assert.ok(fn.includes('eenmanszaak_of_zzp'));
  assert.ok(fn.includes("afgewezen_reden: 'eenmanszaak of zzp'"));
});

test('de run is begrensd in tijd en aantal, en nul opbrengst is zichtbaar',()=>{
  assert.ok(fn.includes('TIJDBUDGET_MS = 120000'));
  assert.ok(fn.includes('Math.min(Number(body?.bedrijven) || MAX_BEDRIJVEN, 40)'));
  assert.ok(fn.includes('nulOpbrengst'));
  assert.ok(fn.includes('ZERO_YIELD'));
});

test('paginatekst wordt als onbetrouwbare invoer behandeld',()=>{
  assert.ok(fn.includes('onbetrouwbare invoer'));
});

test('de tabel is service-only en de migratie plant niets in',()=>{
  assert.ok(sql.includes('enable row level security'));
  assert.ok(sql.includes('revoke all on public.bg_bedrijfsprofiel from public, anon, authenticated'));
  assert.ok(!sql.includes('create policy'));
  assert.ok(sql.includes('security definer'));
  assert.ok(sql.includes("set search_path = ''"));
  assert.ok(sql.includes('least(coalesce(p_limiet, 12), 40)'));
  assert.ok(!sql.includes('cron.schedule'));
});
