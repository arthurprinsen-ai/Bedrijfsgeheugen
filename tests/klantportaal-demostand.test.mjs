import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Demostand van het volledige klantportaal.
 *
 * Met een klant-parameter neemt klantportaal.html de offerteroute: start() stopt
 * meteen en afschermen() verbergt de kaarten. Dat klopt voor een echte klant,
 * maar het maakte de demo een lege huls — en daardoor stond op /klantportaal
 * ?klant=demo1 een los, klein demobestand in plaats van het portaal zelf.
 *
 * Op de demoslugs draait het portaal nu volledig. Wat de demo níet doet: echte
 * klantdata tonen (die komt pas na inloggen uit Supabase) en sporen achterlaten
 * in de browser van een bezoeker.
 */

const PORTAAL = readFileSync('klantportaal.html', 'utf8');
const REDIRECTS = readFileSync('_redirects', 'utf8');

test('demo1 serveert het volledige portaal, niet het losse demobestand', () => {
  assert.match(REDIRECTS, /^\/klantportaal\s+klant=demo1\s+\/klantportaal\.html\s+200!$/m,
    'demo1 wijst niet naar het volledige portaal');
  assert.match(REDIRECTS, /^\/klantportaal\s+klant=demo\s+\/klantportaal\?klant=demo1\s+301!$/m,
    'de korte demoroute wijst niet door naar demo1');
});

test('de demoslugs staan op één plek vast', () => {
  assert.match(PORTAAL, /window\.__BG_DEMO_SLUGS__ = \['demo1','demo'\]/,
    'de demoslugs zijn niet centraal vastgelegd');
  assert.match(PORTAAL, /window\.__BG_IS_DEMO__ = function/);
});

test('de vier grendels laten de demo door', () => {
  assert.match(PORTAAL, /if\(heeftKlantParam\(\) && !window\.__BG_IS_DEMO__\(\)\) return;/,
    'de offerteroute stopt de demo nog steeds vóór start()');
  assert.match(PORTAAL, /function afschermen\(\)\{\s*\n\s*if\(window\.__BG_IS_DEMO__\(\)\) return;/,
    'afschermen() verbergt in demostand nog steeds kaarten');
  assert.match(PORTAAL, /bg_portaal_open'\)==='1'\|\|window\.__BG_IS_DEMO__\(\)/,
    'de demo krijgt niet automatisch de open stand');
});

test('de demo laat geen sporen achter in de browser', () => {
  assert.match(PORTAAL, /function magBewaren\(\)\{[\s\S]{0,200}?if\(window\.__BG_IS_DEMO__\(\)\) return false;/,
    'in demostand wordt er wél naar localStorage geschreven');
});

test('een echte klantslug blijft afgeschermd', () => {
  // ijsselmonde en elke andere slug horen de offerteroute te houden; de demo is
  // een uitzondering en mag dat niet voor iedereen worden.
  assert.match(REDIRECTS, /^\/klantportaal\s+klant=ijsselmonde\s+\/klantportaal\.html\s+200!$/m);
  assert.doesNotMatch(PORTAAL, /__BG_DEMO_SLUGS__ = \[[^\]]*ijsselmonde/,
    'een echte klant staat als demoslug geregistreerd');
  const slugs = PORTAAL.match(/__BG_DEMO_SLUGS__ = \[([^\]]*)\]/)[1];
  assert.equal(slugs.split(',').length, 2, 'er zijn demoslugs bijgekomen zonder dat dit contract is bijgewerkt');
});
