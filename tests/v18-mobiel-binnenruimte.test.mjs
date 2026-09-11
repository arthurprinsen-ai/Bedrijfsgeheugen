import test from 'node:test';
import assert from 'node:assert/strict';
import { scoopCss } from '../tools/bouw-v18-chrome.mjs';
import { bouwModules } from '../tools/v18-modules.mjs';
import { INTERACTIE_CSS } from '../tools/v18-verrijking.mjs';

// Op mobiel plakte op 65 van 87 pagina's de tekst tegen de rand van kaarten en
// kaders (10 sept 2026). Drie oorzaken, elk met een eigen test hieronder.

test('een gescoopte universele reset laat onze eigen componenten met rust', () => {
  const uit = scoopCss('*{box-sizing:border-box;margin:0;padding:0}*::before{margin:0}');
  // Geen kale `.inhoud-body *` meer: die won met 0,1,0 van .bgx-staptegel e.d.
  assert.doesNotMatch(uit, /\.inhoud-body \*\{/);
  assert.match(uit, /\.inhoud-body :where\(\*:not\(\[class\^="bgx-"\]\)\)\{box-sizing:border-box;margin:0;padding:0\}/);
  // Een pseudo achter de ster blijft erachter staan, niet binnen :where().
  assert.match(uit, /\.inhoud-body :where\(\*:not\(\[class\^="bgx-"\]\)\)::before\{margin:0\}/);
  // Gewone selectors blijven precies zoals ze waren.
  assert.equal(scoopCss('.kaart{padding:1rem}'), '.inhoud-body .kaart{padding:1rem}');
});

test('de tijdlijn sluit zichzelf, zodat de rest van het artikel er niet in schuift', () => {
  const bron = '<h2>Drie routes</h2><p>Intro</p>'
    + '<h3>1. Eerste route</h3><p>Uitleg een</p>'
    + '<h3>2. Tweede route</h3><p>Uitleg twee</p>'
    + '<h3>3. Derde route</h3><p>Uitleg drie</p>'
    + '<h2>Wat daarna komt</h2><p>Staat buiten de tijdlijn.</p>';
  const { body } = bouwModules(bron);
  const begin = body.indexOf('<div class="bgx-tijdlijn">');
  assert.ok(begin >= 0, 'drie genummerde stappen horen een tijdlijn te worden');
  const tot = body.indexOf('<h2>Wat daarna komt</h2>');
  const blok = body.slice(begin, tot);
  const open = (blok.match(/<div\b/g) || []).length;
  const dicht = (blok.match(/<\/div>/g) || []).length;
  assert.equal(dicht, open, 'elke <div> in de tijdlijn moet vóór de volgende kop gesloten zijn');
});

test('de veelgestelde vragen staan onder elkaar, niet als chatbubbel in een smalle kolom', () => {
  // assets/stijl.css heeft een chatregel `.vraag{display:flex;justify-content:flex-end}`.
  // Gescoopt raakte die ook het FAQ-blok `div.vraag`: de ingeklapte antwoordbalk
  // nam de helft van de breedte en de vraag stond één woord per regel.
  assert.match(INTERACTIE_CSS, /\.vraag:has\(>h3>\.bgx-vraag\)\{display:block\}/);
});
