import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('process automation money page promises one consistent first-conversation duration', async () => {
  const page = await readFile(new URL('../bedrijfsprocessen-automatiseren.html', import.meta.url), 'utf8');
  assert.match(page, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/bedrijfsprocessen-automatiseren">/);
  assert.match(page, /In 30 minuten bepalen we waar het grootste handwerk zit/);
  assert.match(page, /In een gratis gesprek van 30 minuten bespreken we welk handwerk het meeste kost en of verder onderzoek zinvol is/);
  assert.doesNotMatch(page, /In een halve dag zien we samen waar het handwerk zit/);
  assert.match(page, /href="\/frisse-blik"/);
});
