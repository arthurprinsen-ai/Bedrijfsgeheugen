import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextualActionCards, contextualCardsForPage, toRoadmapProposal } from '../contextual-action-cards.js';
import { bevindingen } from '../bevindingen.js';
import { externalSignalRowToEvent, externalSignalPriority } from '../external-signal-actions.js';
import { PORTAL_PAGE_INDEX } from '../page-registry.js';
import { HERKOMST } from '../external-data.js';

/**
 * Extern signaal naar actie, op de pagina waar het ertoe doet.
 *
 * De regels die deze test bewaakt:
 *   1. geen eigen gegevens, geen externe kaarten (geen signaal over een leeg dossier);
 *   2. elke externe kaart draagt bron, peildatum en reden, en staat op meerdere
 *      relevante pagina's die bestaan;
 *   3. een bron die over zijn herzieningsdatum is, zakt één niveau en zegt dat;
 *   4. regelgeving volgt de branche en de datum, niet de volgorde in het register;
 *   5. het blijft een voorstel: geen euro-effect, geen juridisch oordeel.
 */

const KLANT = { portal: {
  market: { industry: 'ICT & software' },
  metrics: { revenue: 2400000, ebitda: 290000, grossMargin: 48, dso: 52 },
  people: { absence: 5.1, turnover: 19, enps: 12 }
} };
const PEIL = '2026-10-28';
const externe = (state = KLANT, today = PEIL) => buildContextualActionCards(state, { today }).filter(card => card.id.startsWith('extern-'));

test('zonder eigen gegevens komt er geen enkele externe kaart', () => {
  assert.deepEqual(externe({}), []);
  assert.deepEqual(externe({ portal: { market: { industry: 'ICT & software' } } }), []);
});

test('een afwijking van de branchenorm wordt een kaart op de pagina\'s die erdoor geraakt worden', () => {
  const dso = externe().find(card => card.id === 'extern-norm-dso');
  assert.ok(dso, 'DSO van 52 dagen tegenover een norm van 38 hoort een kaart te geven');
  assert.equal(dso.status, 'PROPOSAL_REVIEW_REQUIRED');
  for (const page of ['branche-markt', 'cijfers-maatstaven', 'roadmap', 'advies'])
    assert.ok(contextualCardsForPage(page, KLANT).some(card => card.id === dso.id), `kaart ontbreekt op ${page}`);
  assert.ok(dso.pages.every(page => PORTAL_PAGE_INDEX[page]), 'kaart verwijst naar een pagina die niet bestaat');
});

test('elke externe kaart draagt bron, peildatum, herzieningsdatum en reden', () => {
  const kaarten = externe();
  assert.ok(kaarten.length >= 5);
  for (const kaart of kaarten) {
    const basis = kaart.externalBasis;
    assert.ok(basis, `${kaart.id} mist externalBasis`);
    assert.ok(String(basis.bron).trim().length > 5, `${kaart.id} mist een bron`);
    assert.match(String(basis.peildatum), /^\d{4}-\d{2}-\d{2}$/, `${kaart.id} mist een peildatum`);
    assert.match(String(basis.herzienUiterlijk), /^\d{4}-\d{2}-\d{2}$/, `${kaart.id} mist een herzieningsdatum`);
    assert.ok(String(basis.reden).trim().length > 10, `${kaart.id} mist de reden van de plek`);
  }
});

test('een bedrag is alleen een scenario; zonder eenduidige berekening blijft het leeg', () => {
  const kaarten = externe();
  const dso = kaarten.find(card => card.id === 'extern-norm-dso');
  assert.equal(dso.financialImpact.status, 'SCENARIO_ONLY');
  assert.ok(dso.financialImpact.amount > 0);
  assert.match(dso.financialImpact.reason, /geen gerealiseerde/);
  const verzuim = kaarten.find(card => card.id === 'extern-norm-verzuim');
  assert.equal(verzuim.financialImpact.amount, null);
});

test('een bron over zijn herzieningsdatum zakt één niveau en zegt dat', () => {
  const nu = externe(KLANT, PEIL).find(card => card.id === 'extern-norm-dso');
  const na = externe(KLANT, '2027-03-02').find(card => card.id === 'extern-norm-dso');
  assert.equal(nu.externalBasis.verouderd, false);
  assert.equal(na.externalBasis.verouderd, true);
  assert.ok(HERKOMST.branches.herzienUiterlijk < '2027-03-02', 'testdatum moet na de herzieningsdatum van de branchenormen liggen');
  assert.equal(nu.priority, 'P2');
  assert.equal(na.priority, 'P3');
});

test('prioriteit volgt de harde datum en het bedrag, en zakt bij een verouderde bron', () => {
  assert.equal(externalSignalPriority({ datum: '2026-12-02' }, PEIL), 'P1');
  assert.equal(externalSignalPriority({ datum: '2026-10-01' }, PEIL), 'P1', 'een verstreken datum is geen reden om lager te staan');
  assert.equal(externalSignalPriority({ datum: '2027-06-01' }, PEIL), 'P2');
  assert.equal(externalSignalPriority({ waarde: 5000 }, PEIL), 'P2');
  assert.equal(externalSignalPriority({}, PEIL), 'P3');
  assert.equal(externalSignalPriority({ datum: '2026-12-02', extern: { verouderd: true } }, PEIL), 'P2');
  assert.equal(externalSignalPriority({ extern: { verouderd: true } }, PEIL), 'P3', 'P3 is de bodem');
});

test('regelgeving komt uit het register, volgt de branche en wordt een toetsing, geen oordeel', () => {
  const regels = externe().filter(card => card.externalBasis.dataset === 'regelgeving');
  assert.ok(regels.length >= 1, 'de AI Act-datum van 2 december 2026 hoort bij een ICT-bedrijf');
  const ai = regels.find(card => card.id.includes('eu-ai-act'));
  assert.ok(ai);
  assert.equal(ai.priority, 'P1', 'binnen 90 dagen');
  assert.ok(ai.regulatoryImpact, 'de bestaande regelgevingstrace hoort mee te komen');
  assert.equal(ai.regulatoryImpact.legalStatus, 'REVIEW_REQUIRED');
  assert.equal(ai.regulatoryImpact.financialStatus, 'NOT_QUANTIFIED');
  for (const page of ['wet-regelgeving', 'data-ai', 'roadmap'])
    assert.ok(ai.pages.includes(page), `AI Act-kaart ontbreekt op ${page}`);
  assert.equal(ai.financialImpact.amount, null);
});

test('regelgeving die de branche niet raakt komt niet als kaart', () => {
  const horeca = { portal: { ...KLANT.portal, market: { industry: 'Horeca & recreatie' } } };
  const ids = bevindingen(horeca, PEIL).filter(item => item.extern?.dataset === 'regelgeving').map(item => item.extern.regelId);
  const ict = bevindingen(KLANT, PEIL).filter(item => item.extern?.dataset === 'regelgeving').map(item => item.extern.regelId);
  assert.ok(ict.includes('eu-ai-act'));
  assert.ok(!ids.includes('eu-ai-act'), 'Horeca noemt de AI Act niet in zijn wetgeving');
});

test('elke bevinding verwijst naar een pagina die in het portaal bestaat', () => {
  for (const item of bevindingen(KLANT, PEIL))
    assert.ok(PORTAL_PAGE_INDEX[item.pagina], `${item.id} verwijst naar onbekende pagina ${item.pagina}`);
});

test('een externe kaart kan als voorstel op de roadmap, zonder verzonnen waarde', () => {
  const kaart = externe().find(card => card.id === 'extern-norm-dso');
  const voorstel = toRoadmapProposal(kaart);
  assert.equal(voorstel.reviewRequired, true);
  assert.equal(voorstel.expected_value, null);
  assert.equal(voorstel.sourceFingerprint, 'contextual-action:extern-norm-dso');
  assert.equal(toRoadmapProposal(kaart, [voorstel]), null, 'een tweede keer toevoegen moet niets doen');
});

test('een rij uit bg_externe_signalen wordt alleen een signaal met toestemming, vertrouwen, deadline en bron', () => {
  const rij = { url: 'https://example.org/nieuws/ai-act', titel: 'AI Act deadline', onderwerp: 'EU AI Act', domein: 'ai',
    toegestaan: true, vertrouwen: 0.72, deadline: '2026-12-02', gepubliceerd_op: '2026-10-20T08:00:00Z' };
  const event = externalSignalRowToEvent(rij);
  assert.equal(event.effectiveDate, '2026-12-02');
  assert.equal(event.tenantScoped, false);
  assert.equal(event.evidenceStatus, 'UNVERIFIED');
  assert.equal(externalSignalRowToEvent({ ...rij, toegestaan: false }), null);
  assert.equal(externalSignalRowToEvent({ ...rij, vertrouwen: 0.59 }), null);
  assert.equal(externalSignalRowToEvent({ ...rij, deadline: null }), null);
  assert.equal(externalSignalRowToEvent({ ...rij, url: 'http://example.org' }), null);
  const kaarten = buildContextualActionCards({ portal: { external: { regulatoryEvents: [event] } } }, { today: PEIL });
  const kaart = kaarten.find(card => card.sourcePath === 'portal.external.regulatoryEvents');
  assert.ok(kaart, 'de bestaande kaartenketen moet het signaal oppakken');
  assert.equal(kaart.priority, 'P2', 'niet tenant-geverifieerd, dus nooit P1');
  assert.equal(kaart.regulatoryEvidenceStatus, 'SOURCE_REVIEW_REQUIRED');
});
