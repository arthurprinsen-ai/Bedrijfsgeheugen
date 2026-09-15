import test from 'node:test';
import assert from 'node:assert/strict';
import { directieNavModel, directieNavMarkup } from '../modules/directie-nav.js';
import { DIRECTIEMODEL, groepIdVoorVraag } from '../directiemodel.js';
import { allPageIds, listPortalGroups } from '../page-registry.js';

/**
 * Deze test bewaakt wat de zijbalk moet zijn sinds hij geen mappenkast meer is:
 *
 *   1. de groepen zijn de zes vragen, in de volgorde waarin een directie ze
 *      stelt, met Overzicht ervoor en Beheren erachter;
 *   2. er is geen pagina zoekgeraakt of dubbel gaan staan bij het herindelen;
 *   3. de zijbalk toont nooit een getal - alleen of een vraag te beantwoorden is;
 *   4. een vraag wijst naar de pagina waar het antwoord vandaan komt, en zonder
 *      gegevens naar de plek waar je hem kunt beantwoorden.
 *
 * Wat hij bewust niet toetst: de formulering van een vraag of een domeinregel.
 * Die mag veranderen zonder dat deze test rood wordt.
 */

const ANTWOORDEN_LEEG = DIRECTIEMODEL.map(vraag => ({
  id: vraag.id, vraag: vraag.vraag, groep: groepIdVoorVraag(vraag.id),
  regel: vraag.mist, bron: null, beantwoord: false, pagina: vraag.invul
}));

const ANTWOORDEN_GEVULD = DIRECTIEMODEL.map(vraag => ({
  id: vraag.id, vraag: vraag.vraag, groep: groepIdVoorVraag(vraag.id),
  regel: 'Een antwoord uit eigen gegevens', bron: 'Eigen profiel', beantwoord: true, pagina: vraag.paginas[0]
}));

test('de zijbalk staat in de zes vragen, met Overzicht ervoor en Beheren erachter', () => {
  const model = directieNavModel(ANTWOORDEN_LEEG);
  assert.deepEqual(
    model.map(groep => groep.id),
    ['overzicht', ...DIRECTIEMODEL.map(vraag => groepIdVoorVraag(vraag.id)), 'beheren']
  );
  for (const vraag of DIRECTIEMODEL) {
    const groep = model.find(item => item.vraagId === vraag.id);
    assert.equal(groep.label, vraag.vraag, `${vraag.id} staat niet als vraag in de zijbalk`);
    assert.ok(groep.paginas.length, `${vraag.id} is een lege groep`);
  }
});

test('herindelen naar vragen laat geen pagina achter of dubbel staan', () => {
  const inZijbalk = listPortalGroups().flatMap(groep => groep.pages.map(pagina => pagina.id));
  assert.equal(new Set(inZijbalk).size, inZijbalk.length, 'een pagina hangt onder twee vragen');
  assert.deepEqual([...inZijbalk].sort(), [...allPageIds()].sort(), 'registry en zijbalk lopen uiteen');
  assert.ok(inZijbalk.length >= 49, `het portaal is gekrompen: ${inZijbalk.length} paginas`);
});

test('elke vraag wijst naar een pagina die bestaat', () => {
  const bestaand = new Set(allPageIds());
  for (const antwoorden of [ANTWOORDEN_LEEG, ANTWOORDEN_GEVULD]) {
    for (const groep of directieNavModel(antwoorden)) {
      assert.ok(bestaand.has(groep.doel), `${groep.id} wijst naar onbekende pagina ${groep.doel}`);
    }
  }
});

test('een beantwoorde vraag wijst naar de bron van het antwoord, een onbeantwoorde naar de invulplek', () => {
  const leeg = directieNavModel(ANTWOORDEN_LEEG);
  const gevuld = directieNavModel(ANTWOORDEN_GEVULD);
  for (const vraag of DIRECTIEMODEL) {
    const groepId = groepIdVoorVraag(vraag.id);
    assert.equal(leeg.find(groep => groep.id === groepId).doel, vraag.invul);
    assert.equal(leeg.find(groep => groep.id === groepId).status, 'aanvullen');
    assert.equal(gevuld.find(groep => groep.id === groepId).doel, vraag.paginas[0]);
    assert.equal(gevuld.find(groep => groep.id === groepId).status, 'beantwoord');
  }
});

test('zonder berekende antwoorden belooft de zijbalk niets', () => {
  for (const groep of directieNavModel([])) {
    if (!groep.vraagId) continue;
    assert.equal(groep.status, 'onbekend', `${groep.id} claimt een status zonder antwoorden`);
  }
});

test('in de zijbalk staat geen enkel getal', () => {
  for (const antwoorden of [[], ANTWOORDEN_LEEG, ANTWOORDEN_GEVULD]) {
    const zichtbaar = directieNavMarkup(directieNavModel(antwoorden)).replace(/<[^>]*>/g, ' ');
    assert.equal(/\d/.test(zichtbaar), false, `cijfer in de zijbalk: ${zichtbaar}`);
  }
});

test('de markup geeft per vraag een knop naar het antwoord en een uitklap', () => {
  const model = directieNavModel(ANTWOORDEN_GEVULD);
  const markup = directieNavMarkup(model);
  assert.equal((markup.match(/class="dvnav-vraag"/g) || []).length, model.length);
  assert.equal((markup.match(/class="dvnav-klap"/g) || []).length, model.length);
  for (const vraag of DIRECTIEMODEL) assert.ok(markup.includes(vraag.vraag), `${vraag.id} ontbreekt in de zijbalk`);
});

test('de pagina die open staat is aanwijsbaar in de zijbalk', () => {
  const model = directieNavModel(ANTWOORDEN_GEVULD, 'roadmap');
  const groep = model.find(item => item.paginas.some(pagina => pagina.id === 'roadmap'));
  assert.ok(groep.bevatActievePagina, 'de actieve pagina hoort bij geen enkele vraag');
  assert.ok(directieNavMarkup(model).includes('aria-current="page"'), 'geen aria-current op de open pagina');
});
