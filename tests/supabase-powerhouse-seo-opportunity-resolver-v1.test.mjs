import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn=fs.readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
const owners=JSON.parse(fs.readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/intent-owners.json','utf8'));
const base=JSON.parse(fs.readFileSync('site/seo-order-map.json','utf8'));
const expansion=JSON.parse(fs.readFileSync('site/seo-order-expansion.json','utf8'));
const schedule=fs.readFileSync('supabase/migrations/20260924072500_powerhouse_seo_opportunity_resolver_v1.sql','utf8');
const sourceConfig=JSON.parse(fs.readFileSync('config/seo-search-sources.json','utf8'));

test('runtime intent-owner projection remains complete with canonical SEO maps',()=>{
  const canonical=[...base.pages,...expansion.pages].map(x=>x.route).sort();
  const projected=owners.pages.map(x=>x.route).sort();
  assert.deepEqual(projected,canonical);
  assert.equal(new Set(projected).size,projected.length);
});

test('resolver consumes GSC, cached DataForSEO and external market forecasts before deciding',()=>{
  assert.match(fn,/bg_zoekprestaties/);
  assert.match(fn,/bg_zoekwoordkansen/);
  assert.match(fn,/powerhouse_forecasts/);
  assert.match(fn,/opgehaald_op.*72\*3600000/s);
  assert.match(fn,/opgehaald_op.*14\*86400000/s);
  assert.match(sourceConfig.resolver?.read_order?.join('>')||'',/google-search-console>dataforseo-cache>powerhouse-market-forecasts/);
});

test('resolver improves an existing owner first and only creates content for a distinct high-value gap',()=>{
  assert.match(fn,/UPDATE_MONEY_PAGE/);
  assert.match(fn,/CREATE_INTENT_GAP_CONTENT/);
  assert.match(fn,/NO_ACTION_EVIDENCE_INSUFFICIENT/);
  assert.match(fn,/ownerExists\?'UPDATE_MONEY_PAGE'/);
  assert.match(fn,/item\.action==='CREATE_INTENT_GAP_CONTENT'/);
  assert.match(fn,/publication_guard/);
});

test('first-mover content recommendation enters the existing canonical blog orchestrator, not a parallel publisher',()=>{
  assert.match(fn,/powerhouse_content_recommendations/);
  assert.match(fn,/target_channel:'blog'/);
  assert.match(fn,/seo_first_mover_intent_gap/);
  assert.doesNotMatch(fn,/git push|github\.com|netlify/i);
});

test('resolver writes forecast lineage and never converts modeled opportunity into realized revenue',()=>{
  assert.match(fn,/first_mover_score/);
  assert.match(fn,/revenue_potential:0/);
  assert.match(fn,/truth_boundary/);
  assert.match(fn,/seo-opportunity-intelligence/);
});

test('daily schedule executes after GSC and before the canonical morning publisher window',()=>{
  assert.match(schedule,/powerhouse-seo-opportunity-resolver-daily/);
  assert.match(schedule,/25 5 \* \* \*/);
  assert.match(schedule,/powerhouse_daily_scheduler_token/);
  assert.match(schedule,/net\.http_post/);
});
