import test from 'node:test';
import assert from 'node:assert/strict';
import { doorwerking, doorwerkingAlsTaken, doorwerkingOverzicht,
         rekenwijze, rekenwijzeDekking } from '../doorwerking.js';
import { pageMetrics, pageWorklist, METRIC_EMPTY } from '../page-metrics.js';
import { PORTAL_PAGE_INDEX } from '../page-registry.js';

/**
 * Twee dingen die het oude klantportaal had en Portal V2 niet, allebei over
 * hetzelfde: laten zien dat een keuze gevolgen heeft en dat een bedrag na te
 * rekenen is.
 *
 * Het oude portaal zei het zelf het beste bij de rekenwijze: geen zwarte doos,
 * je kunt ze narekenen. V2 rekende 104 getallen uit zonder ergens te tonen hóe.
 */

const KLANT = { portal: {
  profile: { headcount: 38, hourlyCost: 52, manualHoursPerWeek: 14,
    maturity: { commercie: 4, operatie: 2, finance: 3, tech: 2, mensen: 3 } },
  metrics: { revenue: 4200000, ebitda: 504000 },
  valueFinance: { multiple: 4.5, debt: 480000, cash: 210000 },
  market: { industry: 'Industrie & productie' },
  tasks: { items: [{ title: 'Klantgegevens uit één bron', department: 'Sales' }] }
} };

test('een bedrijfsonderdeel raakt afdelingen met concrete stappen', () => {
  const d = doorwerking('commercie', KLANT);
  assert.ok(d.capabilities.length >= 2, 'geen capabilities gevonden voor commercie');
  assert.ok(d.afdelingen.includes('Sales') && d.afdelingen.includes('Service'));
  assert.ok(d.stappen >= 3);
  assert.equal(d.niveau, 4);
  assert.ok(d.kostenPerJaar > 0, 'het onderdeel krijgt geen bedrag mee');
  assert.equal(doorwerking('bestaatniet', KLANT), null);
});

test('een capability zonder eigen project krijgt een eerlijke stap', () => {
  for (const [afdeling, stappen] of Object.entries(doorwerking('governance', KLANT)?.perAfdeling || {})) {
    assert.ok(stappen.length, `${afdeling} heeft geen stappen`);
    for (const stap of stappen) assert.ok(String(stap).trim().length > 5);
  }
});

test('stappen worden taken, zonder te dupliceren', () => {
  const taken = doorwerkingAlsTaken('commercie', KLANT);
  assert.ok(taken.length >= 2);
  assert.ok(taken.every(taak => taak.department && taak.title && taak.status === 'Open'));
  assert.ok(!taken.some(taak => taak.title === 'Klantgegevens uit één bron' && taak.department === 'Sales'),
    'een taak die al bestaat wordt opnieuw aangemaakt');
  assert.deepEqual(doorwerkingAlsTaken('bestaatniet', KLANT), []);
});

test('het overzicht toont alleen onderdelen waar een niveau is ingevuld', () => {
  const overzicht = doorwerkingOverzicht(KLANT);
  assert.equal(overzicht.length, 4, 'er komen onderdelen mee zonder ingevuld niveau');
  for (let i = 1; i < overzicht.length; i += 1)
    assert.ok((overzicht[i].kostenPerJaar || 0) <= (overzicht[i - 1].kostenPerJaar || 0),
      'de duurste onderdelen staan niet bovenaan');
  assert.deepEqual(doorwerkingOverzicht({}), [],
    'bij een leeg dossier worden toch onderdelen getoond; de capabilitykast bestaat los van de klant');
});

test('elke berekening toont zijn formule, en zonder invoer geen uitkomst', () => {
  for (const regel of rekenwijze(KLANT)) {
    assert.ok(regel.formule.includes('×') || regel.formule.includes('÷') || regel.formule.includes('−'),
      `${regel.id} toont geen formule`);
    assert.ok(String(regel.uitleg).length > 20, `${regel.id} legt niets uit`);
  }
  for (const regel of rekenwijze({})) {
    assert.equal(regel.compleet, false);
    assert.equal(regel.uitkomst, null, `${regel.id} toont een uitkomst zonder invoer`);
    assert.ok(regel.nodig.length, `${regel.id} zegt niet wat er nodig is`);
  }
});

test('de uitkomsten komen uit de eigen cijfers', () => {
  const regels = rekenwijze(KLANT);
  const marge = regels.find(r => r.id === 'ebitda-marge');
  assert.equal(marge.uitkomst, '12.0%', 'de marge is niet uit omzet en EBITDA berekend');
  assert.match(marge.invoer, /504\.000/);
  const handwerk = regels.find(r => r.id === 'handwerk-per-onderdeel');
  assert.match(handwerk.invoer, /factor\(niveau \d\)/);
  assert.match(handwerk.uitkomst, /^€/);
  // Dit bedrijf heeft geen businesscase ingevuld, dus de terugverdientijd is
  // niet te berekenen. Dat hoort 83 procent te geven en niet 100: een
  // berekening zonder invoer mag niet meetellen alsof hij klopt.
  assert.equal(rekenwijzeDekking(KLANT).percentage, 83);
  const terugverdien = regels.find(r => r.id === 'terugverdientijd');
  assert.equal(terugverdien.compleet, false);
  assert.ok(terugverdien.nodig.includes('investering'), 'er staat niet wat er nodig is');
  assert.equal(rekenwijzeDekking({}).percentage, 0);
});

test('de rekenwijze staat als pagina in het portaal', () => {
  assert.ok(PORTAL_PAGE_INDEX.rekenwijze, 'de rekenwijze is geen pagina');
  const metrics = pageMetrics('rekenwijze', KLANT);
  assert.equal(metrics[0][0], 'Berekeningen');
  assert.notEqual(metrics[0][1], METRIC_EMPTY);
  const lijst = pageWorklist('rekenwijze', KLANT);
  assert.ok(lijst.every(([, uitleg]) => /×|÷|−/.test(uitleg)), 'niet elke regel toont zijn formule');
  assert.ok(pageMetrics('rekenwijze', {}).every(([, waarde]) => waarde === METRIC_EMPTY));
});

test('doorwerking komt terug op de wijzigingenpagina', () => {
  const lijst = pageWorklist('wijzigingen', { ...KLANT, portal: { ...KLANT.portal,
    changes: { items: [{ change: 'ERP-planning', status: 'Open' }] } } });
  assert.ok(lijst.some(([label]) => /raakt \d+ afdelingen/.test(label)),
    'een wijziging laat niet zien welke afdelingen hij raakt');
});
