// TDD contract for opportunity-first Powerhouse intelligence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const engineUrl = pathToFileURL(resolve('supabase/functions/powerhouse-runtime/opportunity-engine.mjs')).href;
const sourcesUrl = pathToFileURL(resolve('netlify/functions/_powerhouse-opportunity-sources.mjs')).href;

async function loadEngine(){ return import(engineUrl); }
async function loadSources(){ return import(sourcesUrl); }

test('normalizes external signals into canonical opportunity evidence', async () => {
  const { normalizeExternalSignal } = await loadEngine();
  const signal = normalizeExternalSignal({
    source: 'news', sourceUrl: 'https://example.com/story', topic: 'AI governance MKB', audience: 'directie',
    observedAt: '2026-09-09T10:00:00Z', intent: 0.82, relevance: 0.91, freshness: 0.97,
    evidenceStrength: 0.8, commercialValue: 0.74, engagementPotential: 0.68, urgency: 0.88,
    context: { market: 'NL', trigger: 'new-regulation' }
  });
  assert.equal(signal.source, 'news');
  assert.equal(signal.topic, 'AI governance MKB');
  assert.equal(signal.audience, 'directie');
  assert.equal(signal.context.trigger, 'new-regulation');
  assert.ok(signal.signalKey.startsWith('signal:'));
  assert.ok(signal.features.intent > 0.8);
});

test('scores commercially relevant fresh multi-signal opportunities above vanity-only signals', async () => {
  const { scoreOpportunity } = await loadEngine();
  const revenueIntent = scoreOpportunity({intent:0.9,relevance:0.95,urgency:0.85,commercialValue:0.92,evidenceStrength:0.85,engagementPotential:0.55,freshness:0.95,sourceDiversity:0.8,customerFit:0.9,saturation:0.1,repetitionRisk:0.05,learnedDelta:8});
  const vanity = scoreOpportunity({intent:0.25,relevance:0.55,urgency:0.2,commercialValue:0.15,evidenceStrength:0.4,engagementPotential:0.98,freshness:0.9,sourceDiversity:0.2,customerFit:0.25,saturation:0.7,repetitionRisk:0.65,learnedDelta:0});
  assert.ok(revenueIntent.score >= 75, JSON.stringify(revenueIntent));
  assert.ok(revenueIntent.score > vanity.score + 35, `${revenueIntent.score} vs ${vanity.score}`);
  assert.ok(revenueIntent.components.commercialValue > revenueIntent.components.engagementPotential);
});

test('chooses channel and content based on opportunity context instead of always publishing', async () => {
  const { chooseOpportunityAction } = await loadEngine();
  assert.equal(chooseOpportunityAction({ score:88,intent:.9,searchDemand:.88,conversationVelocity:.4,depthNeed:.92,hasExistingContent:false }).actionType,'create_blog');
  assert.equal(chooseOpportunityAction({ score:82,intent:.72,searchDemand:.35,conversationVelocity:.92,depthNeed:.35,hasExistingContent:false }).actionType,'create_social_post');
  assert.equal(chooseOpportunityAction({ score:79,intent:.91,accountSignal:.95,personContext:true,depthNeed:.25 }).actionType,'sales_follow_up');
  assert.equal(chooseOpportunityAction({ score:49,intent:.4,searchDemand:.4,conversationVelocity:.4 }).actionType,'observe');
});

test('exploration is bounded and deterministic while exploitation stays dominant', async () => {
  const { shouldExplore } = await loadEngine();
  let explore=0; for(let i=0;i<100;i++) if(shouldExplore(`candidate-${i}`,0.15)) explore++;
  assert.ok(explore>=8&&explore<=22,`explore=${explore}`);
  assert.equal(shouldExplore('same-candidate',.15),shouldExplore('same-candidate',.15));
});

test('parses RSS and turns fresh external evidence into contextual opportunity signals', async () => {
  const { parseExternalFeed, externalSignalFromItem } = await loadSources();
  const xml=`<rss><channel><item><title>Nieuwe AI Act verplichtingen voor mkb</title><link>https://example.com/ai-act</link><pubDate>Wed, 09 Sep 2026 10:30:00 GMT</pubDate><description>Ondernemers moeten AI governance en documentatie op orde brengen.</description></item></channel></rss>`;
  const items=parseExternalFeed(xml,'application/rss+xml');
  assert.equal(items.length,1);
  assert.equal(items[0].url,'https://example.com/ai-act');
  const signal=externalSignalFromItem(items[0],{id:'regulation-watch',type:'regulation',audience:'directie',market:'NL',keywords:['ai','mkb','governance'],commercialWeight:.85,evidenceStrength:.9},new Date('2026-09-09T12:00:00Z'));
  assert.equal(signal.source,'regulation-watch');
  assert.equal(signal.context.trigger,'external-feed');
  assert.ok(signal.relevance>=.7,JSON.stringify(signal));
  assert.ok(signal.urgency>=.6,JSON.stringify(signal));
  assert.ok(signal.commercialValue>=.7,JSON.stringify(signal));
  assert.ok(signal.depthNeed>=.6,JSON.stringify(signal));
});

test('external source inventory spans news regulation search market competitor and customer signals', async () => {
  const { defaultOpportunitySources } = await loadSources();
  const types=new Set(defaultOpportunitySources().map(source=>source.type));
  for(const required of ['news','regulation','search','market','competitor','customer']) assert.ok(types.has(required),`missing ${required}`);
});

test('scheduled scanner proactively sends discovered evidence to opportunity-signals without Make', async () => {
  const fs=await import('node:fs/promises');
  const source=await fs.readFile('netlify/functions/powerhouse-opportunity-scan.mjs','utf8');
  assert.match(source,/schedule\s*:\s*['"]@hourly['"]/);
  assert.match(source,/opportunity-signals/);
  assert.match(source,/defaultOpportunitySources/);
  assert.doesNotMatch(source,/make\.com|hook\.eu\d+\.make\.com|MAKE_WEBHOOK/i);
});

test('runtime exposes opportunity ingest/read routes and keeps Make out of the critical path', async () => {
  const fs=await import('node:fs/promises');
  const source=await fs.readFile('supabase/functions/powerhouse-runtime/index.ts','utf8');
  assert.match(source,/opportunities/); assert.match(source,/opportunity-signals/); assert.match(source,/scoreOpportunity/); assert.match(source,/chooseOpportunityAction/);
  assert.doesNotMatch(source,/make\.com|hook\.eu\d+\.make\.com|MAKE_WEBHOOK/i);
});
