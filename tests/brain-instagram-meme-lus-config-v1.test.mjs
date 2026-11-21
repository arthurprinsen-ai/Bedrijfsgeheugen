import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const cfg = JSON.parse(readFileSync(new URL('../config/instagram-meme-lus-v1.json', import.meta.url), 'utf8'));

test('dagplafond is 400 credits en niet ruimer', () => {
  assert.equal(cfg.dagplafond_credits, 400);
});

test('gezichtspoort blijft 0,94 op begin, midden en eind', () => {
  assert.equal(cfg.gezichtspoort.drempel, 0.94);
  assert.deepEqual(cfg.gezichtspoort.frames, ['begin', 'midden', 'eind']);
  assert.equal(cfg.gezichtspoort.versoepelen, false);
});

test('maximaal een nieuwe kandidaat per mislukking', () => {
  assert.equal(cfg.max_nieuwe_kandidaten_per_mislukking, 1);
});

test('een variabele per post en geen waarheidsniveaus samengevoegd', () => {
  assert.equal(cfg.regel_een_variabele_per_post, true);
  assert.ok(cfg.waarheidsniveaus_niet_samenvoegen.includes('omzet'));
  assert.ok(cfg.waarheidsniveaus_niet_samenvoegen.includes('publicatie'));
});

test('beslisregels: verlengen max 2, anders INSUFFICIENT_EVIDENCE', () => {
  assert.equal(cfg.beslisregels.verlengen_max, 2);
  assert.equal(cfg.beslisregels.anders, 'INSUFFICIENT_EVIDENCE');
});

test('volgers staan onderaan de beloningsvolgorde', () => {
  assert.equal(cfg.beloning_volgorde[cfg.beloning_volgorde.length - 1], 'volgers');
});
