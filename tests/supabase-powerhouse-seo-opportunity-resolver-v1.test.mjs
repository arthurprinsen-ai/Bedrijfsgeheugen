import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn=fs.readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/index.ts','utf8');
const owners=JSON.parse(fs.readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/intent-owners.json','utf8'));
const base=JSON.parse(fs.readFileSync('site/seo-order-map.json','utf8'));
const expansion=JSON.parse(fs.readFileSync('site/seo-order-expansion.json','utf8'));
const schedule=fs.readFileSync('supabase/migration-history/repository-only/20260924072500_powerhouse_seo_opportunity_resolver_v1.sql','utf8');
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
  assert.match(fn,/opgehaald_op.*7\*86400000/s);
  assert.match(sourceConfig.resolver?.read_order?.join('>')||'',/google-search-console>dataforseo-cache>powerhouse-market-forecasts/);
  assert.equal(sourceConfig.resolver.freshness_hours['dataforseo-cache'],168);
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

test('source-backed UPDATE_MONEY_PAGE is handed off to existing website owner, never silently forecast-only',()=>{
  assert.match(fn,/selectOriginalSeoMoneyHandoffs\(top,\{runDate,observedAt,max:3\}\)/);
  assert.match(fn,/target_channel:'blog'/);
  assert.match(fn,/SEO_ORIGINAL_OWNER_HANDOFF_WRITE/);
  assert.match(fn,/onConflict:'dedupe_key',ignoreDuplicates:true/);
  assert.match(fn,/owner_handoffs_written:ownerHandoffsWritten/);
  assert.match(fn,/execution_readback:'EVIDENCE_DUE'/);
});
test('Twinfield API short query has one canonical intent owner in original registry and locale map',()=>{
  const route='https://www.bedrijfsgeheugen.nl/twinfield-koppeling';
  assert.equal(base.pages.filter(p=>p.secondary_keywords?.includes('twinfield api')).length,1);
  const owner=owners.pages.find(p=>p.route===route);
  assert.ok(owner?.secondary_keywords?.includes('twinfield api'));
  const locale=JSON.parse(fs.readFileSync('site/seo-locale-revenue-map.json','utf8'));
  assert.ok(locale.pages.find(p=>p.source_route===route)?.nl?.secondary_keywords?.includes('twinfield api'));
  const html=fs.readFileSync('twinfield-koppeling.html','utf8');
  assert.match(html,/<title>Twinfield API-koppeling laten maken \| Bedrijfsgeheugen<\/title>/);
  assert.match(html,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/twinfield-koppeling"/);
});
