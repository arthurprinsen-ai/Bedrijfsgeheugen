import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync('supabase/migrations/20261027180000_news_approved_contacts_first_v1.sql', 'utf8');
test('approved e-mail contacts are looked up first', () => {
  assert.match(sql, /human_approved' = 'true'/);
  assert.match(sql, /1000::numeric score/);
  assert.match(sql, /not in \(select a\.bedrijf from approved a\)/);
});
test('30-day recheck window and limit cap are kept', () => {
  assert.match(sql, /interval '30 days'/);
  assert.match(sql, /least\(p_limiet, 20\)/);
});
test('security definer function is fail-closed for browser roles', () => {
  assert.match(sql, /revoke all on function public\.bg_bedrijven_voor_nieuws\(integer\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.bg_bedrijven_voor_nieuws\(integer\) to service_role/);
});
