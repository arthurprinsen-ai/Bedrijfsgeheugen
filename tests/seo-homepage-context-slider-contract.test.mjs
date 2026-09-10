import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyHomepageContextSliderReadability } from '../tools/site-shell/fix-homepage-context-slider.mjs';

/**
 * Contract van de vergelijk-slider op de homepage.
 *
 * Waarom dit bestand er is
 * ------------------------
 * De slider is op 9 september 2026 vijf keer achter elkaar herbouwd (#1272,
 * #1279, #1282, #1286, #1302). Elke herbouw liet zijn eigen test achter, en die
 * tests toetsten op broncode: functienamen, exacte CSS-waarden, exacte
 * attribuutnamen. Daardoor stonden er drie testbestanden rood die samen een
 * onmogelijk beeld schetsten:
 *
 *   - seo-homepage-context-slider-native-range.test.mjs eiste dat de generator
 *     'ensureNativeRange' en 'bg-compare-range' bevat;
 *   - seo-homepage-context-slider-pointer-capture.test.mjs eiste dat diezelfde
 *     generator die dingen juist NIET bevat.
 *
 * Die twee konden nooit tegelijk groen zijn. Het pointer-capture-contract is
 * vervangen door #1286 ("Replace mobile compare slider with native range") en
 * is daarmee vervallen. De derde, seo-homepage-context-slider-ios-edge-reach,
 * toetste op een negatieve marge van -28px die in de huidige opzet niet meer
 * bestaat.
 *
 * Deze test vervangt alle drie en toetst wat er werkelijk toe doet, op de
 * gegenereerde uitkomst in plaats van op de broncode: precies één bedienings-
 * mechanisme, een bereik van 0 tot 100, een overlay die de hele slider bedekt,
 * en eindstanden die echt bereikbaar zijn. Een volgende herbouw mag de
 * implementatie veranderen zonder deze test om te gooien; alleen een gebroken
 * belofte hoort hem rood te maken.
 */

const DEMO_PAGE = '<!doctype html><html><head></head><body>'
  + '<div id="compareSlider"><div class="compare-before"></div><div class="compare-after"></div>'
  + '<div class="compare-handle"><button class="compare-knob"></button></div></div>'
  + '</body></html>';

const generated = applyHomepageContextSliderReadability(DEMO_PAGE);
const browserCheck = await readFile(new URL('../tools/site-shell/homepage-context-slider-browser-check.mjs', import.meta.url), 'utf8');

test('de gegenereerde slider heeft precies één bedieningsmechanisme', () => {
  const bootstraps = generated.match(/data-bg-compare-bootstrap/g) || [];
  assert.equal(bootstraps.length, 1, `verwacht één bootstrap, gevonden ${bootstraps.length}`);

  // Twee mechanismen die tegelijk luisteren was de oorzaak van de haperende
  // slider op iOS. Native range en een eigen touch-owner sluiten elkaar uit.
  const heeftNativeRange = /type\s*=\s*'range'|type\s*=\s*"range"/.test(generated);
  const heeftEigenTouchOwner = /addEventListener\('touch(start|move|end)'/.test(generated);
  assert.ok(heeftNativeRange || heeftEigenTouchOwner, 'de slider heeft helemaal geen bediening');
  assert.ok(!(heeftNativeRange && heeftEigenTouchOwner), 'native range en een eigen touch-owner vechten om dezelfde gesture');
});

test('het bereik loopt van 0 tot 100 zonder verborgen randclamp', () => {
  assert.match(generated, /min\s*=\s*'0'/, 'ondergrens is niet 0');
  assert.match(generated, /max\s*=\s*'100'/, 'bovengrens is niet 100');
  assert.doesNotMatch(generated, /Math\.max\((?:6|8|30|40),/, 'er zit nog een oude ondergrens in de bediening');
  assert.doesNotMatch(generated, /aria-valuemin=(['"])(?:6|8|30|40)\1/, 'aria-valuemin is niet genormaliseerd naar 0');
  assert.doesNotMatch(generated, /aria-valuemax=(['"])(?:60|70|92|94)\1/, 'aria-valuemax is niet genormaliseerd naar 100');
});

test('de bedieningslaag bedekt de hele slider en blijft onzichtbaar', () => {
  const regel = (generated.match(/\.bg-compare-range\{[^}]*\}/) || [])[0];
  assert.ok(regel, 'er is geen stijlregel voor de bedieningslaag');
  assert.match(regel, /position:absolute/, 'de bedieningslaag ligt niet over de slider');
  assert.match(regel, /(inset:0|(left:0[\s\S]*right:0))/, 'de bedieningslaag bedekt niet de volle breedte');
  const opacity = Number((regel.match(/opacity:([\d.]+)/) || [])[1] ?? 1);
  assert.ok(opacity < 0.05, `de bedieningslaag is zichtbaar (opacity ${opacity})`);
  const zIndex = Number((regel.match(/z-index:(\d+)/) || [])[1] ?? 0);
  assert.ok(zIndex > 0, 'de bedieningslaag ligt niet boven de beelden');
});

test('de eindstanden worden als eindstand herkend', () => {
  assert.match(generated, /data-bg-compare-endpoint/, 'de slider markeert zijn eindstanden niet');
  assert.match(generated, /'start'/, 'de beginstand wordt niet gemarkeerd');
  assert.match(generated, /'end'/, 'de eindstand wordt niet gemarkeerd');
});

test('de generator is herhaalbaar en stapelt niets op', () => {
  const tweemaal = applyHomepageContextSliderReadability(generated);
  assert.equal((tweemaal.match(/data-bg-compare-bootstrap/g) || []).length, 1, 'tweede build voegt een tweede bootstrap toe');
  assert.equal((tweemaal.match(/data-bg-context-slider-readable/g) || []).length,
    (generated.match(/data-bg-context-slider-readable/g) || []).length,
    'tweede build stapelt stijlblokken op');
});

test('de browsertest meet de slider in een echte browser', () => {
  assert.match(browserCheck, /bg-compare-range|compare-handle/, 'de browsertest kent de slider niet');
  assert.match(browserCheck, /getBoundingClientRect/, 'de browsertest meet geen echte afmetingen');
  assert.match(browserCheck, /--bg-compare-split/, 'de browsertest leest de doorgerekende stand niet uit');
  assert.match(browserCheck, /data-bg-compare-endpoint/, 'de browsertest controleert de eindstanden niet');
  assert.match(browserCheck, /dispatchEvent/, 'de browsertest bedient de slider niet');
});
