import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261025101500_company_news_widen_eligible_search_before_cooldown.sql',import.meta.url),'utf8');

test('candidate pool expands only within existing bounded helper',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.bg_inhaak_kandidaten/);
  assert.match(sql,/least\(p_limiet, 1500\)/);
  assert.match(sql,/order by coalesce\(s\.score, c\.prioriteit\) desc nulls last/);
  assert.match(sql,/c\.status in \('nieuw','rust'\)/);
  assert.match(sql,/c\.sleutel is not null/);
  assert.match(sql,/not exists \(select 1 from public\.powerhouse_sales_actions a/);
});
test('company news selector widens prefilter but retains bounded provider budget',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.bg_bedrijven_voor_nieuws/);
  assert.match(sql,/'Investeerder'\], 1500\) k/);
  assert.match(sql,/g\.laatst_gecheckt < now\(\) - interval '30 days'/);
  assert.match(sql,/limit greatest\(1, least\(p_limiet, 20\)\)/);
  assert.match(sql,/distinct on \(k\.bedrijf\)/);
});
test('no new job, privileged role, push, external sender, or new source table',()=>{
  assert.doesNotMatch(sql,/cron\.schedule|create table|insert into|net\.http_post|create trigger|create policy|security invoker/i);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.bg_inhaak_kandidaten\(text\[\], integer\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.bg_bedrijven_voor_nieuws\(integer\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.bg_inhaak_kandidaten\(text\[\], integer\) TO service_role/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.bg_bedrijven_voor_nieuws\(integer\) TO service_role/);
  assert.doesNotMatch(sql,/GRANT EXECUTE ON FUNCTION .* TO (PUBLIC|anon|authenticated)/);
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/SET search_path TO ''/);
});
