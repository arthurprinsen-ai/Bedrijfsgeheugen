import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readSupabaseMigrationHistory } from './helpers/read-supabase-migration-history.mjs';

test('bilingual SEO revenue migration keeps locale and market in canonical identity',async()=>{
  const sql=await readSupabaseMigrationHistory('20260930113000_powerhouse_bilingual_seo_revenue_v1.sql');
  assert.match(sql,/powerhouse_seo_keyword_intelligence_v1/);
  assert.match(sql,/primary key \(tenant_id, locale, market, keyword\)/);
  assert.match(sql,/powerhouse_seo_keyword_revenue_priority_v1/);
  assert.match(sql,/revenue_opportunity_score/);
  assert.match(sql,/'en','United Kingdom','en','sovereign ai',2400,13\.28/);
  assert.match(sql,/'en','United Kingdom','en','ai governance',1300,24\.01/);
});

test('growth intelligence consumes bilingual keyword revenue evidence before legacy keyword rows',async()=>{
  const source=await readFile('netlify/functions/growth-intelligence-daily.mjs','utf8');
  assert.match(source,/powerhouse_seo_keyword_revenue_priority_v1/);
  assert.match(source,/const bilingual=/);
  assert.match(source,/const keywordRows=\[\.\.\.bilingual,\.\.\.\(input\.keywords\|\|\[\]\)\]/);
  assert.match(source,/canonical_owner:k\.canonical_owner\|\|null/);
  assert.match(source,/conversion_destination:k\.conversion_destination\|\|null/);
});

test('bilingual market evidence is tied to commercial owners and conversion destinations',async()=>{
  const map=JSON.parse(await readFile('site/seo-locale-revenue-map.json','utf8'));
  for(const e of map.measured_keyword_evidence){
    assert.ok(e.keyword);
    assert.ok(e.locale==='nl'||e.locale==='en');
    assert.ok(e.market);
    assert.ok(Number(e.search_volume)>=0);
    assert.ok(Number(e.cpc_eur)>=0);
  }
  const aiModel=map.pages.find(x=>x.source_route==='https://www.bedrijfsgeheugen.nl/ai-modelwijzer');
  assert.equal(aiModel.conversion_destination,'https://www.bedrijfsgeheugen.nl/frisse-blik');
  assert.equal(aiModel.en.route,'https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer');
});
