import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIEVRAGEN, directieAntwoorden, directievragenMarkup } from '../modules/directievragen.js';
import { allPageIds } from '../page-registry.js';

/**
 * Deze test bewaakt drie dingen aan de zes vragen boven het overzicht:
 *
 *   1. ze staan er alle zes, in de volgorde waarin een directie ze stelt;
 *   2. zonder eigen gegevens beantwoordt het portaal er geen enkele - het meldt
 *      wat er mist en wijst naar de plek waar je dat invult;
 *   3. elke knop opent een pagina die bestaat.
 *
 * Wat hij bewust níet toetst is de formulering van een antwoordregel. Die mag
 * veranderen zonder dat deze test rood wordt; wat moet blijven staan is dat er
 * een antwoord is, waar het vandaan komt en waar het heen wijst.
 */

const LEEG = {};

const GEVULD = {
  portal: {
    profile: { maturity: { strategie: 2, processen: 3, data: 1 }, headcount: 24, manualHoursPerWeek: 18, employees: 24, hourlyCost: 52 },
    metrics: { revenue: 4200000 },
    roadmap: { items: [
      { title: 'Offerteproces automatiseren', owner: 'Sanne', progress: 40 },
      { title: 'Exact koppelen', owner: 'Mark', progress: 0 },
      { title: 'Kennisbank opzetten', owner: 'Lotte', progress: 100, done: true }
    ] }
  }
};

test('de zes vragen staan er, in vaste volgorde', () => {
  assert.deepEqual(
    DIRECTIEVRAGEN.map(vraag => vraag.id),
    ['gezond', 'vastlopen', 'koers', 'aankomend', 'zelf', 'besluit']
  );
  assert.deepEqual(directieAntwoorden(GEVULD).map(item => item.id), DIRECTIEVRAGEN.map(vraag => vraag.id));
});

test('zonder eigen gegevens blijft elke vraag eerlijk onbeantwoord', () => {
  for (const antwoord of directieAntwoorden(LEEG)) {
    assert.equal(antwoord.beantwoord, false, `${antwoord.id} beantwoordt zichzelf zonder gegevens`);
    assert.equal(antwoord.bron, null);
    assert.ok(antwoord.regel.length > 10, `${antwoord.id} moet melden wat er mist`);
  }
});

test('zonder eigen gegevens staat er geen enkel getal in het blok', () => {
  const markup = directievragenMarkup(LEEG);
  const zichtbaar = markup.replace(/<[^>]*>/g, ' ');
  assert.equal(/\d/.test(zichtbaar), false, `demo-cijfer in de lege staat: ${zichtbaar}`);
});

test('met eigen gegevens komt er een antwoord met een bron', () => {
  const antwoorden = directieAntwoorden(GEVULD, '2026-09-15');
  const perId = Object.fromEntries(antwoorden.map(item => [item.id, item]));

  assert.equal(perId.gezond.beantwoord, true);
  assert.match(perId.gezond.regel, /van 5/);
  assert.equal(perId.gezond.pagina, 'profiel');

  assert.equal(perId.koers.beantwoord, true);
  assert.match(perId.koers.regel, /3 roadmaponderdelen/);
  assert.equal(perId.koers.pagina, 'roadmap');

  assert.equal(perId.besluit.beantwoord, true);
  assert.ok(perId.besluit.bron, 'een besluit zonder bron is een mening');
  assert.equal(perId.besluit.pagina, 'advies');

  for (const antwoord of antwoorden) {
    if (antwoord.beantwoord) assert.ok(antwoord.bron, `${antwoord.id} geeft een antwoord zonder bron`);
  }
});

test('elke knop wijst naar een pagina die in de zijbalk bestaat', () => {
  const bestaand = new Set(allPageIds());
  for (const state of [LEEG, GEVULD]) {
    for (const antwoord of directieAntwoorden(state, '2026-09-15')) {
      assert.ok(bestaand.has(antwoord.pagina), `${antwoord.id} wijst naar onbekende pagina ${antwoord.pagina}`);
    }
  }
});

test('het blok rendert zes kaarten met een knop per vraag', () => {
  const markup = directievragenMarkup(GEVULD, '2026-09-15');
  assert.equal((markup.match(/class="dv-kaart/g) || []).length, 6);
  assert.equal((markup.match(/data-pv-page="/g) || []).length, 6);
  for (const vraag of DIRECTIEVRAGEN) assert.ok(markup.includes(vraag.vraag), `${vraag.id} ontbreekt in het blok`);
});
