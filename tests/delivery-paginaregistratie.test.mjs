import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

/**
 * Elke publieke pagina moet in een delivery-lane vallen.
 *
 * Op 10 september 2026 bleken 40 van de 60 root-pagina's nergens geregistreerd
 * in config/brain-delivery-system.json — 404.html, over-ons.html, privacy.html,
 * contact.html en 36 andere. Gevolg: elke wijziging aan zo'n pagina liet de
 * preflight omvallen met "unclassified delivery path", en de lane-classificatie
 * kon niet bepalen welke tests er hoorden te draaien.
 *
 * Dat is dezelfde soort blinde vlek als de 46 testbestanden die nergens
 * draaiden (#1347): iets bestaat, maar het leveringssysteem weet er niet van.
 * Deze test vangt de terugval.
 */

const POLICY = JSON.parse(readFileSync('config/brain-delivery-system.json', 'utf8'));
const SHA = '0'.repeat(40);

const rootPaginas = () => readdirSync('.').filter(naam => naam.endsWith('.html'));

test('elke root-pagina valt in een delivery-lane', () => {
  const ongeclassificeerd = [];
  for (const pagina of rootPaginas()) {
    try {
      createDeliveryPlan({ changedPaths: [pagina], headSha: SHA, policy: POLICY });
    } catch (fout) {
      if (/unclassified delivery path/.test(fout.message)) ongeclassificeerd.push(pagina);
      else throw fout;
    }
  }
  assert.deepEqual(ongeclassificeerd, [],
    'Deze pagina\'s staan in geen enkele lane. Voeg ze toe aan de website-lane in ' +
    'config/brain-delivery-system.json, anders valt de preflight om zodra iemand ze aanraakt.');
});

test('een root-pagina hoort bij de website- of portal-lane', () => {
  // klantportaal.html hoort bij de portal-lane; dat is geen fout maar de
  // bedoeling. Wat niet mag, is een pagina die in een lane valt waar geen
  // websitewerk gebeurt, want dan draaien de verkeerde tests.
  const toegestaan = new Set(['website', 'portal']);
  const verkeerd = [];
  for (const pagina of rootPaginas()) {
    const plan = createDeliveryPlan({ changedPaths: [pagina], headSha: SHA, policy: POLICY });
    if (!plan.lanes.some(lane => toegestaan.has(lane.id)))
      verkeerd.push(`${pagina} -> ${plan.lanes.map(l => l.id).join(',')}`);
  }
  assert.deepEqual(verkeerd, [], 'deze pagina\'s vallen in een lane die geen paginawerk draait');
});

test('de registratie noemt geen pagina die niet meer bestaat', () => {
  const bestaand = new Set(rootPaginas());
  const website = POLICY.lanes.find(lane => lane.id === 'website');
  const spoken = website.paths.filter(pad => pad.endsWith('.html') && !pad.includes('/') && !bestaand.has(pad));
  assert.deepEqual(spoken, [],
    'deze pagina\'s staan geregistreerd maar bestaan niet meer; haal ze uit de lane-configuratie');
});

/**
 * Dezelfde blinde vlek, maar dan voor testbestanden.
 *
 * Op 11 september 2026 bleken 57 testbestanden die CI wél draait niet
 * classificeerbaar in config/brain-delivery-system.json. Gevolg: elke PR die er
 * één aanraakt loopt vast op de preflight met "unclassified delivery path",
 * zonder dat er iets mis is met de test of de wijziging. Dat is precies wat er
 * gebeurde bij tests/customer-portal-routing.test.mjs in #1393.
 *
 * Dat getal hoort te dalen. Loopt het op, dan is er een testbestand bijgekomen
 * dat CI draait maar het leveringssysteem niet kent.
 */
const TESTS_ZONDER_LANE = 57;

const workflowTekst = () => readdirSync('.github/workflows')
  .filter(naam => /\.ya?ml$/.test(naam))
  .map(naam => readFileSync(`.github/workflows/${naam}`, 'utf8'))
  .join('\n');

test('het aantal gedraaide tests zonder lane loopt niet op', () => {
  const workflows = workflowTekst();
  const zonderLane = readdirSync('tests')
    .filter(naam => naam.endsWith('.test.mjs'))
    .map(naam => `tests/${naam}`)
    .filter(pad => workflows.includes(pad))
    .filter(pad => {
      try { createDeliveryPlan({ changedPaths: [pad], headSha: SHA, policy: POLICY }); return false; }
      catch (fout) { return /unclassified delivery path/.test(fout.message); }
    });
  assert.ok(zonderLane.length <= TESTS_ZONDER_LANE,
    `er zijn nu ${zonderLane.length} testbestanden die CI draait maar die geen lane hebben, was ${TESTS_ZONDER_LANE}. ` +
    `Nieuw erbij: ${zonderLane.slice(0, 5).join(', ')}. Registreer ze in config/brain-delivery-system.json, ` +
    'anders loopt elke PR die ze aanraakt vast op de preflight.');
});
