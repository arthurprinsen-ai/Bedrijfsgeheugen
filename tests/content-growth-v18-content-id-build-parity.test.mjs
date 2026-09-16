import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ensurePublicationMarker } from '../tools/content-growth/publication-marker-build-guard.mjs';

test('v18 rebuild guard restores publication content id on the rebuilt body', () => {
  const built = '<!doctype html><html><body class="shell"><main>gebouwd</main></body></html>';
  const actual = ensurePublicationMarker(built, 'blog:ongeprijsd-probleem-bedrijfsvoering');

  assert.match(actual, /<body class="shell" data-content-id="blog:ongeprijsd-probleem-bedrijfsvoering">/);
});

test('v18 rebuild guard does not invent, duplicate or silently replace publication ids', () => {
  const built = '<html><body class="shell"><main>gebouwd</main></body></html>';
  assert.equal(ensurePublicationMarker(built, ''), built);

  const alreadyMarked = '<html><body class="shell" data-content-id="blog:voorbeeld"><main>gebouwd</main></body></html>';
  assert.equal(ensurePublicationMarker(alreadyMarked, 'blog:voorbeeld'), alreadyMarked);
  assert.throws(() => ensurePublicationMarker(alreadyMarked, 'blog:ander'), /conflicting publication marker/);
});

test('pricing shell pipeline restores canonical publication markers after all HTML normalizers', () => {
  const pipeline = fs.readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(pipeline, /import \{ applyLedgerPublicationMarkers \} from '\.\/content-growth\/publication-marker-build-guard\.mjs';/);
  const validate = pipeline.indexOf('await validateSeoOrderEngine();');
  const guard = pipeline.indexOf('await applyLedgerPublicationMarkers();');
  assert.notEqual(validate, -1);
  assert.notEqual(guard, -1);
  assert.equal(guard > validate, true);
});
