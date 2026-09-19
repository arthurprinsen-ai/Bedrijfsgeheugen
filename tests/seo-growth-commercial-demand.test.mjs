import test from 'node:test';
import assert from 'node:assert/strict';
import { proposeOpportunities } from '../tools/seo-growth/opportunities.mjs';

const registry={pages:[{
  route:'https://www.bedrijfsgeheugen.nl/bedrijfsprocessen-automatiseren',
  role:'money',
  primary_intent:'bedrijfsprocessen automatiseren',
  primary_keyword:'bedrijfsprocessen automatiseren'
}]};

test('commercial demand improves the existing intent owner first',()=>{
  const ops=proposeOpportunities({
    canonical:'https://www.bedrijfsgeheugen.nl/bedrijfsprocessen-automatiseren',
    query:'bedrijfsprocessen automatiseren',
    search_volume:480,
    cpc:14.53,
    search_intent:'commercial',
    market_confidence:.95
  },registry);
  const market=ops.find(x=>x.type==='commercial-search-demand');
  assert.ok(market);
  assert.equal(market.reason,'existing-intent-owner-first');
  assert.equal(market.content_creation,'blocked-unless-distinct-intent-gap');
  assert.ok(!market.allowed_actions.includes('supporting-blog-opportunity'));
});

test('unowned demand stays a candidate until mapping and cannibalization checks',()=>{
  const ops=proposeOpportunities({
    query:'nieuwe koopintentie',
    search_volume:90,
    cpc:8,
    search_intent:'transactional',
    market_confidence:.8
  },registry);
  const candidate=ops.find(x=>x.type==='discovery-search-demand');
  assert.ok(candidate);
  assert.equal(candidate.content_creation,'candidate-only-after-cannibalization-check');
});
