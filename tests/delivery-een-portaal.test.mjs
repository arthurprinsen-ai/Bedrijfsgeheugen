import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Er is één klantportaal: Portal V2.
 *
 * Tot 11 september 2026 draaiden er drie sporen naast elkaar — portal/,
 * portal-next/ en portal-v2/ — en alle drie waren ze live. Dat is de oorzaak
 * geweest van dubbel werk (#1300), van een PR die al achterhaald was voordat hij
 * open stond (#1288), en van twee lagen die hetzelfde beweerden en apart
 * verouderden.
 *
 * Alles uit beide oude sporen zit nu in V2: het Data & AI Passport en het EU AI
 * Act-auditrapport (#1385), de compliance-engine, de Powerhouse-route en het
 * inlezen van oude back-ups (#1388). De routes wijzen daarom door naar V2.
 *
 * De mappen portal/ en portal-next/ staan er nog. Er hangen tientallen tests en
 * verwijzingen aan; die opruimen is een aparte klus. Deze test bewaakt wat er nu
 * geldt: geen enkele bezoekersroute komt nog in een oud spoor uit.
 */

const REDIRECTS = readFileSync('_redirects', 'utf8');

const regels = () => REDIRECTS.split('\n')
  .map(regel => regel.trim())
  .filter(regel => regel && !regel.startsWith('#'));

test('geen enkele route stuurt een bezoeker nog naar een oud portaalspoor', () => {
  const fout = regels().filter(regel => {
    const delen = regel.split(/\s+/);
    const doel = delen.find((deel, index) => index > 0 && deel.startsWith('/'));
    return doel === '/portal/' || doel?.startsWith('/portal/') || doel?.startsWith('/portal-next/');
  });
  assert.deepEqual(fout, [],
    'deze routes komen nog uit in portal/ of portal-next/; alles hoort naar /portal-v2/ te wijzen');
});

test('de oude sporen worden doorgestuurd in plaats van doodlopend', () => {
  const tekst = regels().join('\n');
  assert.match(tekst, /^\/portal\/\*\s+\/portal-v2\/\s+301!$/m,
    '/portal/* stuurt niet door naar V2; bezoekers landen dan op wat er toevallig nog staat');
  assert.match(tekst, /^\/portal-next\/\*\s+\/portal-v2\/\s+301!$/m,
    '/portal-next/* stuurt niet door naar V2');
  assert.match(tekst, /^\/portaal\s+\/portal-v2\/\s+301!$/m);
});

test('de demo-klant komt in hetzelfde portaal als iedereen', () => {
  const tekst = regels().join('\n');
  assert.match(tekst, /^\/klantportaal\s+klant=demoAI\s+\/portal-v2\/\s+301!$/m,
    'de demoAI-klant krijgt nog een ander portaal dan de rest');
});

test('het oude klantportaal blijft bereikbaar zolang klanten erop staan', () => {
  const tekst = regels().join('\n');
  // klantportaal.html is het portaal waar echte klantslugs op uitkomen. Dat is
  // een ander spoor dan portal/ en portal-next/ en gaat hier niet weg: die
  // migratie loopt via V2 zelf, niet via een redirect.
  assert.match(tekst, /^\/klantportaal\s+klant=:klant\s+\/klantportaal\.html\s+200!$/m,
    'de route voor echte klantslugs is weg; die klanten kunnen dan niet meer bij hun portaal');
});
