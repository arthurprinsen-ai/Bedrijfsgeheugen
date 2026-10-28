import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextualActionCards } from '../portal-v2/contextual-action-cards.js';
import { bevindingen } from '../portal-v2/bevindingen.js';
import { PORTAL_PAGE_INDEX } from '../portal-v2/page-registry.js';

// Replay/shadow/canary for the bridge from external signals to contextual portal actions.
// Source of truth for the ranking stays bevindingen.js; this only proves the bridge.
const KLANT = { portal: { market: { industry: 'ICT & software' },
  metrics: { revenue: 2400000, ebitda: 290000, grossMargin: 48, dso: 52 }, people: { absence: 5.1, turnover: 19, enps: 12 } } };
const cards = (state, today) => buildContextualActionCards(state, { today }).filter(card => card.id.startsWith('extern-'));

test('no own data means no external card', () => {
  assert.deepEqual(cards({}, '2026-10-28'), []);
});

test('regulation findings now reach the portal and follow the branch', () => {
  const ict = bevindingen(KLANT, '2026-10-28').filter(item => item.extern?.dataset === 'regelgeving').map(item => item.extern.regelId);
  const horeca = bevindingen({ portal: { ...KLANT.portal, market: { industry: 'Horeca & recreatie' } } }, '2026-10-28')
    .filter(item => item.extern?.dataset === 'regelgeving').map(item => item.extern.regelId);
  assert.ok(ict.includes('eu-ai-act'));
  assert.ok(!horeca.includes('eu-ai-act'));
});

test('every external card carries source, reference date and an existing page; an outdated source drops one level', () => {
  const nu = cards(KLANT, '2026-10-28');
  const laat = cards(KLANT, '2027-03-02');
  assert.ok(nu.length >= 5);
  for (const card of nu) {
    assert.ok(card.externalBasis.bron && card.externalBasis.peildatum && card.externalBasis.herzienUiterlijk);
    assert.ok(card.pages.length && card.pages.every(page => PORTAL_PAGE_INDEX[page]));
    assert.equal(card.status, 'PROPOSAL_REVIEW_REQUIRED');
  }
  assert.equal(nu.find(card => card.id === 'extern-norm-dso').priority, 'P2');
  assert.equal(laat.find(card => card.id === 'extern-norm-dso').priority, 'P3');
});

test('findings never point at a page that does not exist', () => {
  for (const item of bevindingen(KLANT, '2026-10-28')) assert.ok(PORTAL_PAGE_INDEX[item.pagina], item.id + ' -> ' + item.pagina);
});
