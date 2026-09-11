import test from 'node:test';
import assert from 'node:assert/strict';
import { bevindingen, bevindingenSamenvatting } from '../bevindingen.js';
import { pageMetrics, pageWorklist, METRIC_EMPTY } from '../page-metrics.js';
import { pageVisual } from '../page-visuals.js';

/**
 * Het portaal rekende honderd getallen uit en concludeerde niets.
 *
 * De pagina's `advies` en `kansenkaart` en de berekening `blocker-ranking` lazen
 * allemaal een lijst die iemand met de hand had ingetypt. Gemeten met een
 * volledig ingevuld bedrijf — 38 medewerkers, 4,2 miljoen omzet, volwassenheid
 * per onderdeel, compliance-controls, businesscase — bleven ze leeg. Het portaal
 * liet zien wat je erin stopte, niet wat eruit volgde.
 *
 * bevindingen.js leidt af uit wat al is doorgerekend. Deze test bewaakt de drie
 * regels die dat eerlijk houden:
 *
 *   1. geen bevindingen zonder eigen gegevens;
 *   2. elke bevinding draagt bewijs én een bron;
 *   3. een bedrag verschijnt alleen waar het te berekenen valt — een verzonnen
 *      bedrag is erger dan geen bedrag.
 */

const KLANT = { portal: {
  company: { name: 'Van Dijk Techniek BV' },
  profile: { headcount: 38, hourlyCost: 52, manualHoursPerWeek: 14,
    maturity: { sturing: 3, commercie: 4, operatie: 2, finance: 3, mensen: 3, tech: 2, data: 2, klant: 4 } },
  metrics: { revenue: 4200000, ebitda: 504000, grossMargin: 38, dso: 52, wages: 1900000, it: 63000 },
  people: { absence: 5.4, turnover: 17, enps: 8 },
  market: { industry: 'Industrie & productie' },
  compliance: { controls: [
    { id: 'nis-1', framework: 'NIS2', requirement: 'Zorgplicht', applicability: 'applicable',
      control: { implemented: true }, verifiedAt: '2025-02-01', severity: 'high',
      evidence: [{ id: 'e1', verified: true, validUntil: '2025-12-01' }] },
    { id: 'avg-2', framework: 'AVG', requirement: 'Datalekprocedure', applicability: 'applicable',
      control: { implemented: false }, severity: 'critical' }
  ] }
} };

test('zonder eigen gegevens komt er geen enkele bevinding', () => {
  assert.deepEqual(bevindingen({}), [],
    'het portaal concludeert iets over een leeg dossier; dat is precies wat in #1339 eruit is gehaald');
  assert.equal(bevindingenSamenvatting({}).totaal, 0);
  assert.equal(bevindingenSamenvatting({}).eerste, null);
  assert.deepEqual(bevindingen({ portal: { metrics: {} } }), []);
});

test('met een ingevuld bedrijf komt er een geordende lijst uit', () => {
  const lijst = bevindingen(KLANT);
  assert.ok(lijst.length >= 5, `te weinig bevindingen: ${lijst.length}`);
  for (let i = 1; i < lijst.length; i += 1)
    assert.ok(lijst[i].score <= lijst[i - 1].score, 'de lijst staat niet op volgorde van wat het oplevert');
});

test('elke bevinding draagt bewijs, een bron en een pagina', () => {
  for (const item of bevindingen(KLANT)) {
    assert.ok(String(item.bewijs).trim().length > 15, `${item.id} heeft geen bewijs`);
    assert.ok(String(item.bron).trim().length > 5, `${item.id} heeft geen bron`);
    assert.ok(String(item.pagina).trim(), `${item.id} verwijst niet naar een pagina`);
    assert.ok(['klein', 'middel', 'groot'].includes(item.moeite), `${item.id} heeft geen moeite-inschatting`);
    assert.ok(['kosten', 'markt', 'kans', 'verplichting'].includes(item.soort), `${item.id} heeft een onbekende soort`);
  }
});

test('een bedrag verschijnt alleen waar het te berekenen valt', () => {
  const lijst = bevindingen(KLANT);
  const handmatig = lijst.find(item => item.id === 'handmatig-werk');
  assert.ok(handmatig, 'handmatig werk ontbreekt, terwijl uren en uurkosten zijn ingevuld');
  assert.ok(handmatig.waarde > 0);
  assert.match(handmatig.bewijs, /14 uur per week/);

  // Bij verzuim, verloop en eNPS is het verschil met de norm niet eenduidig in
  // geld uit te drukken. Daar hoort dus geen bedrag te staan.
  for (const item of lijst.filter(x => /eNPS|Verloop|Verzuim/.test(x.titel)))
    assert.equal(item.waarde, null, `${item.titel} draagt een verzonnen bedrag`);
});

test('een cijfer dat ongunstig afwijkt wordt ook zo genoemd', () => {
  const loonquote = bevindingen(KLANT).find(item => /Loonquote/.test(item.titel));
  if (!loonquote) return;
  assert.match(loonquote.titel, /ongunstig/,
    'bij een loonquote hoort een hogere waarde slechter te zijn; "ligt onder de norm" zegt het omgekeerde');
  assert.match(loonquote.bewijs, /tegenover/, 'het eigen cijfer staat niet naast de norm');
});

test('verplichtingen komen uit de compliance-controls, met hun raamwerk', () => {
  const lijst = bevindingen(KLANT).filter(item => item.soort === 'verplichting');
  assert.ok(lijst.length >= 2);
  const datalek = lijst.find(item => /Datalekprocedure/.test(item.titel));
  assert.ok(datalek, 'de niet-ingerichte kritieke control ontbreekt');
  assert.match(datalek.bron, /AVG/);
  const zorgplicht = lijst.find(item => /Zorgplicht/.test(item.titel));
  assert.match(zorgplicht.bewijs, /bewijs ontbreekt of is verlopen/,
    'verlopen bewijs wordt niet als zodanig gemeld');
});

test('de adviespagina concludeert nu in plaats van af te lezen', () => {
  const metrics = pageMetrics('advies', KLANT);
  assert.equal(metrics[0][0], 'Bevindingen');
  assert.notEqual(metrics[0][1], METRIC_EMPTY);
  assert.match(metrics[2][0], /Waarde per jaar/);
  assert.equal(metrics[3][0], 'Eerst aanpakken');

  const lijst = pageWorklist('advies', KLANT);
  assert.ok(lijst.length >= 4);
  assert.ok(lijst.some(([label]) => label.includes('€')), 'geen enkele regel noemt een bedrag');
  assert.ok(lijst.every(([, uitleg]) => uitleg.includes('—')), 'niet elke regel noemt zijn bron');

  assert.match(pageVisual('advies', KLANT), /<figure class="v2visual"/);
  assert.equal(pageVisual('advies', {}), '', 'de adviespagina tekent op een leeg dossier');
  assert.ok(pageMetrics('advies', {}).every(([, waarde]) => waarde === METRIC_EMPTY));
});

test('een eigen ingetypte advieslijst blijft werken', () => {
  const eigen = { portal: { advice: { items: [
    { advice: 'Zelf bedacht advies', priority: 5, value: 25000, owner: 'Arthur' }] } } };
  const metrics = pageMetrics('advies', eigen);
  assert.equal(metrics[0][0], 'Adviezen', 'een eigen lijst wordt niet meer getoond');
  assert.equal(metrics[0][1], '1');
});
