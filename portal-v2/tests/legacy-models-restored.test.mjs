import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLegacyEquivalent as calc } from '../legacy-parity-engine.js';
import { ladder, dupont, gauge } from '../visuals.js';
import { pageVisual } from '../page-visuals.js';
import { pageMetrics, pageWorklist } from '../page-metrics.js';

/**
 * Vijf modellen die het vorige klantportaal wel tekende en Portal V2 niet had:
 * CMMI, Greiner, trusted advisor, DuPont en de EBITDA-multiple. De formules
 * zijn een op een geport uit klantportaal.html; deze test bewaakt dat ze blijven
 * rekenen én dat ze op een scherm terechtkomen. Zonder klantdata tekenen ze
 * niets — dezelfde regel als voor alle andere pagina's.
 */

const KLANT = { portal: {
  profile: { headcount: 38, dimensions: { service: 4, mensen: 3 }, dimensionScores: [3,4,2,3,3],
             maturity: { sturing:3, commercie:4, operatie:2, finance:3, mensen:3 }, manualHoursPerWeek: 12, hourlyCost: 52 },
  metrics: { revenue: 2400000, ebitda: 290000, largestCustomer: 18, repeat: 62, grossMargin: 42 },
  valueFinance: { balance: 1200000, equity: 400000, multiple: 5, debt: 200000, cash: 80000, interest: 40000 },
  dataAi: { phase: 'Pilot', maturity: 3 }
} };

test('CMMI komt uit de gemiddelde volwassenheid, net als in het oude portaal', () => {
  assert.equal(calc('cmmi-level', KLANT), 3);
  const trap = calc('cmmi-ladder', KLANT);
  assert.equal(trap.length, 5);
  assert.equal(trap.find(step => step.huidig).naam, 'Gedefinieerd');
  assert.equal(trap.filter(step => step.bereikt).length, 2);
  assert.equal(calc('cmmi-level', {}), 0, 'zonder scores geen niveau');
});

test('Greiner leidt de groeifase af uit het aantal mensen', () => {
  assert.equal(calc('greiner-phase', KLANT).fase, 'Groei door delegatie');
  assert.match(calc('greiner-phase', KLANT).crisis, /Beheersingscrisis/);
  assert.equal(calc('greiner-phase', { portal: { profile: { headcount: 6 } } }).fase, 'Groei door creativiteit');
  assert.equal(calc('greiner-phase', { portal: { profile: { headcount: 400 } } }).fase, 'Groei door samenwerking');
  assert.equal(calc('greiner-phase', {}), null, 'zonder personeelsomvang geen fase');
});

test('trusted advisor telt dezelfde drie signalen als het oude portaal', () => {
  assert.equal(calc('trusted-advisor-level', KLANT), 4);
  const kaal = { portal: { profile: { dimensions: {} }, metrics: {} } };
  assert.equal(calc('trusted-advisor-level', kaal), 1, 'zonder signalen sta je onderaan');
  const alleenService = { portal: { profile: { dimensions: { service: 3 } }, metrics: {} } };
  assert.equal(calc('trusted-advisor-level', alleenService), 2);
});

test('DuPont ontleedt het rendement in marge, omloop en hefboom', () => {
  const d = calc('dupont-breakdown', KLANT);
  assert.ok(d.netMargin > 0 && d.assetTurnover > 0 && d.leverage > 0);
  assert.equal(Number(d.assetTurnover.toFixed(2)), 2);
  assert.equal(Number(d.leverage.toFixed(2)), 3);
  const verwachtRoe = d.netMargin / 100 * d.assetTurnover * d.leverage * 100;
  assert.ok(Math.abs(d.roe - verwachtRoe) < 1e-9, 'ROE is niet het product van de drie factoren');
  assert.equal(calc('dupont-breakdown', {}).roe, 0);
});

test('de drie nieuwe beeldvormen tekenen niets op lege data', () => {
  assert.equal(ladder([]), '');
  assert.equal(dupont({}), '');
  assert.match(ladder(calc('cmmi-ladder', KLANT)), /^<figure class="v2visual"/);
  assert.match(dupont(calc('dupont-breakdown', KLANT)), /^<figure class="v2visual"/);
  assert.match(gauge(2.4, { min: 0, max: 6 }), /^<figure class="v2visual"/);
});

test('elk model landt op een scherm', () => {
  const paren = [['overzicht','CMMI'],['data-ai','Greiner'],['cijfers-maatstaven','Trusted advisor'],
                 ['waarde-financiering','DuPont'],['waarde-financiering','Altman Z']];
  for (const [page, model] of paren) {
    assert.ok(pageVisual(page, KLANT).includes(model), `${model} staat niet op ${page}`);
    assert.equal(pageVisual(page, {}), '', `${page} tekent op lege data`);
  }
});

test('de nieuwe modellen staan ook als leesbaar cijfer op het scherm', () => {
  assert.match(pageMetrics('overzicht', KLANT).find(([l]) => l === 'Procesvolwassenheid')[1], /3\/5 · Gedefinieerd/);
  assert.equal(pageMetrics('data-ai', KLANT).find(([l]) => l === 'Groeifase')[1], 'Groei door delegatie');
  assert.equal(pageMetrics('cijfers-maatstaven', KLANT).find(([l]) => l === 'Positie bij de klant')[1], 'Vertrouwd adviseur');
  const labels = pageWorklist('waarde-financiering', KLANT).map(([l]) => l);
  for (const nodig of ['Schuldendekking (DSCR)', 'Rendement op eigen vermogen (DuPont)', 'EBITDA-multiple'])
    assert.ok(labels.includes(nodig), `${nodig} ontbreekt in de werklijst`);
});

test('offerte en onderzoek hebben nu ook beeld', () => {
  const offerte = { portal: { offer: { package: 'Groei', sprints: 4, approval: { agreed: true, name: 'Sam' } } } };
  assert.match(pageVisual('offerte', offerte), /<figure/);
  const onderzoek = { portal: { research: { hypotheses: [{ hypothesis: 'a', evidence: 'x', source: 'y' }, { hypothesis: 'b' }] } } };
  assert.match(pageVisual('onderzoek', onderzoek), /<figure/);
});
