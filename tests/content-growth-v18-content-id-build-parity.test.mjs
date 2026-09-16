import test from 'node:test';
import assert from 'node:assert/strict';
import { behoudContentIdMarker } from '../tools/bouw-v18-chrome.mjs';

test('v18 rebuild preserves publication content id on the rebuilt body', () => {
  const source = '<!doctype html><html><body class="legacy" data-content-id="blog:ongeprijsd-probleem-bedrijfsvoering"><main>bron</main></body></html>';
  const built = '<!doctype html><html><body class="shell"><main>gebouwd</main></body></html>';
  const actual = behoudContentIdMarker(built, source);

  assert.match(actual, /<body class="shell" data-content-id="blog:ongeprijsd-probleem-bedrijfsvoering">/);
});

test('v18 rebuild does not invent or duplicate publication content ids', () => {
  const withoutMarker = '<html><body><main>bron</main></body></html>';
  const built = '<html><body class="shell"><main>gebouwd</main></body></html>';
  assert.equal(behoudContentIdMarker(built, withoutMarker), built);

  const source = '<html><body data-content-id="blog:voorbeeld"><main>bron</main></body></html>';
  const alreadyMarked = '<html><body class="shell" data-content-id="blog:voorbeeld"><main>gebouwd</main></body></html>';
  assert.equal(behoudContentIdMarker(alreadyMarked, source), alreadyMarked);
});
