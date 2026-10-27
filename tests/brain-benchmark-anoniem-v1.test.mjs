import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateIntake, benchmarkVisible, BRANCHES, OMVANGEN } from '../supabase/functions/_shared/benchmark-intake.mjs';

const ok = { branche: 'Zorg', omvang: '10 tot 25', uren: 1240, compleet: 'ja' };

test('geldige inzending wordt omgezet naar de tabelrij, zonder extra velden', () => {
  const v = validateIntake({ ...ok, bedrijf: 'Mag er niet in', knelpunt: 'x' });
  assert.equal(v.ok, true);
  assert.deepEqual(Object.keys(v.row).sort(), ['branche', 'bron', 'omvang', 'uren_per_jaar']);
  assert.equal(v.row.uren_per_jaar, 1240);
  assert.equal(v.row.bron, 'ai-scan');
});

test('onbekende branche of omvang wordt geweigerd', () => {
  assert.equal(validateIntake({ ...ok, branche: 'Onzin' }).error, 'BRANCHE_INVALID');
  assert.equal(validateIntake({ ...ok, omvang: '1000 tot 2000' }).error, 'OMVANG_INVALID');
});

test('uren moeten een positief geheel getal binnen de grens zijn', () => {
  assert.equal(validateIntake({ ...ok, uren: 0 }).error, 'UREN_INVALID');
  assert.equal(validateIntake({ ...ok, uren: 12.5 }).error, 'UREN_INVALID');
  assert.equal(validateIntake({ ...ok, uren: 'veel' }).error, 'UREN_INVALID');
  assert.equal(validateIntake({ ...ok, uren: 1000001 }).error, 'UREN_INVALID');
});

test('niet-afgeronde scan wordt geweigerd', () => {
  assert.equal(validateIntake({ ...ok, compleet: 'nee' }).error, 'SCAN_NIET_COMPLEET');
});

test('geen object of array wordt geweigerd', () => {
  assert.equal(validateIntake(null).ok, false);
  assert.equal(validateIntake([ok]).ok, false);
});

test('benchmark toont een groep pas vanaf vijf deelnemers', () => {
  assert.equal(benchmarkVisible(4), false);
  assert.equal(benchmarkVisible(5), true);
});

test('de keuzelijsten op de pagina komen overeen met de validatie', () => {
  const html = readFileSync(new URL('../ai-scan.html', import.meta.url), 'utf8');
  for (const b of BRANCHES) assert.ok(html.includes('<option>' + b + '</option>'), 'branche ontbreekt op pagina: ' + b);
  for (const o of OMVANGEN) assert.ok(html.includes('<option>' + o + '</option>'), 'omvang ontbreekt op pagina: ' + o);
});

test("de pagina stuurt naar de edge function op het eigen Supabase-project", () => {
  const html = readFileSync(new URL("../ai-scan.html", import.meta.url), "utf8");
  const m = html.match(/var HAAK='([^']+)'/);
  assert.ok(m, "HAAK-endpoint niet gevonden");
  const u = new URL(m[1]);
  assert.equal(u.protocol, "https:");
  assert.equal(u.hostname, "adhjwmvyoixzjtmiroln.supabase.co");
  assert.equal(u.pathname, "/functions/v1/bg-benchmark-intake");
});

test('migratie: tabel is afgeschermd en aggregaat heeft drempel van vijf', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261027210000_benchmark_anoniem_intake_v1.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on public\.benchmark_anoniem_inzendingen from public, anon, authenticated/);
  assert.match(sql, /security_invoker = true/);
  assert.match(sql, /having count\(\*\) >= 5/);
});
