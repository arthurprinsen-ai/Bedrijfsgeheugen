import test from 'node:test';
import assert from 'node:assert/strict';
import { proposeOpportunities } from '../tools/seo-growth/opportunities.mjs';

const allowlist = ['title-meta','cta-copy-position','internal-link','content-gap','supporting-blog-opportunity','cannibalization-proposal','keyword-cluster-expansion','evidence-gap'];

test('lage CTR op pagina 3 of verder is een rangschikkingskans, geen titel-en-meta-kans', () => {
  const ops = proposeOpportunities({ canonical: 'https://www.bedrijfsgeheugen.nl/afas-pocket-koppelen', impressions: 614, clicks: 0, position: 32.6 }, { pages: [] });
  assert.equal(ops[0].type, 'ranking');
  assert.ok(!ops[0].allowed_actions.includes('title-meta'));
  assert.ok(ops[0].allowed_actions.every(a => allowlist.includes(a)));
});

test('lage CTR op pagina 1 blijft een titel-en-meta-kans', () => {
  const ops = proposeOpportunities({ canonical: 'https://www.bedrijfsgeheugen.nl/prijzen', impressions: 5000, clicks: 40, avg_position: 6 }, { pages: [] });
  assert.equal(ops[0].type, 'serp-ctr');
  assert.ok(ops[0].allowed_actions.includes('title-meta'));
});

test('zonder bekende positie blijft het oude gedrag (titel en meta)', () => {
  const ops = proposeOpportunities({ canonical: 'https://www.bedrijfsgeheugen.nl/prijzen', impressions: 5000, clicks: 40 }, { pages: [] });
  assert.equal(ops[0].type, 'serp-ctr');
});
