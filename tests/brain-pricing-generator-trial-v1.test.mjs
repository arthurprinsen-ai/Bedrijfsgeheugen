import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const src = await readFile('tools/site-shell/apply-commercial-pricing-v1.mjs', 'utf8');

test('prijzen-generator geeft proef-knoppen voor directe pakketten', () => {
  assert.match(src, /afsluiten\?plan='\+p\.code\+'&trial=1'/);
  assert.match(src, /'Start 30 dagen gratis'/);
  assert.doesNotMatch(src, /'Start '\+esc\(p\.name\)/);
});

test('prijzen-generator: slotknop en uitleg over de proefperiode', () => {
  assert.match(src, /afsluiten\?plan=starter&trial=1">Start 30 dagen gratis/);
  assert.match(src, /30 dagen gratis proberen:/);
});

test('prijzen-generator: Engelse vertaling en lang=en op de afsluit-links', () => {
  assert.match(src, /\['Start 30 dagen gratis','Start 30 days free'\]/);
  assert.match(src, /Try free for 30 days:/);
  assert.match(src, /replaceAll\('&trial=1"','&trial=1&lang=en"'\)/);
});
