// TDD RED contract for opportunity-first Powerhouse intelligence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const engineUrl = pathToFileURL(resolve('supabase/functions/powerhouse-runtime/opportunity-engine.mjs')).href;

async function loadEngine(){
  return import(engineUrl);
}

test('normalizes external signals into canonical opportunity evidence', async () => {
  const { normalizeExternalSignal } = await loadEngine();
  const signal = normalizeExternalSignal({
    source: 'news',
    sourceUrl: 'https://example.com/story',
    topic: 'AI governance MKB',
    audience: 'directie',
    observedAt: '2026-09-09T10:00:00Z',
    intent: 0.82,
    relevance: 0.91,
    freshness: 0.97,
    evidenceStrength: 0.8,
    commercialValue: 0.74,
    engagementPotential: 0.68,
    urgency: 0.88,
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
  const revenueIntent = scoreOpportunity({
    intent: 0.9, relevance: 0.95, urgency: 0.85, commercialValue: 0.92,
    evidenceStrength: 0.85, engagementPotential: 0.55, freshness: 0.95,
    sourceDiversity: 0.8, customerFit: 0.9, saturation: 0.1, repetitionRisk: 0.05,
    learnedDelta: 8
  });
  const vanity = scoreOpportunity({
    intent: 0.25, relevance: 0.55, urgency: 0.2, commercialValue: 0.15,
    evidenceStrength: 0.4, engagementPotential: 0.98, freshness: 0.9,
    sourceDiversity: 0.2, customerFit: 0.25, saturation: 0.7, repetitionRisk: 0.65,
    learnedDelta: 0
  });
  assert.ok(revenueIntent.score >= 75, JSON.stringify(revenueIntent));
  assert.ok(revenueIntent.score > vanity.score + 35, `${revenueIntent.score} vs ${vanity.score}`);
  assert.ok(revenueIntent.components.commercialValue > revenueIntent.components.engagementPotential);
});

test('chooses channel and content based on opportunity context instead of always publishing', async () => {
  const { chooseOpportunityAction } = await loadEngine();
  assert.equal(chooseOpportunityAction({ score: 88, intent: 0.9, searchDemand: 0.88, conversationVelocity: 0.4, depthNeed: 0.92, hasExistingContent: false }).actionType, 'create_blog');
  assert.equal(chooseOpportunityAction({ score: 82, intent: 0.72, searchDemand: 0.35, conversationVelocity: 0.92, depthNeed: 0.35, hasExistingContent: false }).actionType, 'create_social_post');
  assert.equal(chooseOpportunityAction({ score: 79, intent: 0.91, accountSignal: 0.95, personContext: true, depthNeed: 0.25 }).actionType, 'sales_follow_up');
  assert.equal(chooseOpportunityAction({ score: 49, intent: 0.4, searchDemand: 0.4, conversationVelocity: 0.4 }).actionType, 'observe');
});

test('exploration is bounded and deterministic while exploitation stays dominant', async () => {
  const { shouldExplore } = await loadEngine();
  let explore = 0;
  for(let i=0;i<100;i++) if(shouldExplore(`candidate-${i}`, 0.15)) explore++;
  assert.ok(explore >= 8 && explore <= 22, `explore=${explore}`);
  assert.equal(shouldExplore('same-candidate', 0.15), shouldExplore('same-candidate', 0.15));
});

test('runtime exposes opportunity ingest/read routes and keeps Make out of the critical path', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile('supabase/functions/powerhouse-runtime/index.ts','utf8');
  assert.match(source, /opportunities/);
  assert.match(source, /opportunity-signals/);
  assert.match(source, /scoreOpportunity/);
  assert.match(source, /chooseOpportunityAction/);
  assert.doesNotMatch(source, /make\.com|hook\.eu\d+\.make\.com|MAKE_WEBHOOK/i);
});
