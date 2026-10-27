import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261020113000_p0_4215_portal_read_sort_indexes.sql', import.meta.url), 'utf8');
const edge = readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts', import.meta.url), 'utf8');
test('portal publication global sort has a bounded matching migration index', () => {
  assert.match(edge, /from\('bronpublicaties'\)[\s\S]*?order\('publicatiedatum',\{ascending:false,nullsFirst:false\}\)\.limit\(350\)/);
  assert.match(sql, /ON public\.bronpublicaties \(publicatiedatum DESC NULLS LAST\)/);
});
test('portal permitted-signals sort has a bounded partial index', () => {
  assert.match(edge, /from\('bg_externe_signalen'\)[\s\S]*?eq\('toegestaan',true\)\.order\('gepubliceerd_op',\{ascending:false,nullsFirst:false\}\)\.limit\(250\)/);
  assert.match(sql, /ON public\.bg_externe_signalen \(gepubliceerd_op DESC NULLS LAST\)\s+WHERE toegestaan IS TRUE/);
});
test('migration is additive, idempotent and bounded in lock wait', () => {
  assert.equal((sql.match(/CREATE INDEX IF NOT EXISTS/g) || []).length, 2);
  assert.match(sql, /SET LOCAL lock_timeout = '2s'/);
  assert.match(sql, /SET LOCAL statement_timeout = '20s'/);
  assert.doesNotMatch(sql, /\b(?:DROP|TRUNCATE|DELETE|REVOKE|ALTER\s+POLICY)\b/i);
});
