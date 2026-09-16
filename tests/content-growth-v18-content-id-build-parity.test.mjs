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

test('production and deploy-preview builds run the publication marker guard after V18 chrome', () => {
  const netlify = fs.readFileSync('netlify.toml', 'utf8');
  const commands = [...netlify.matchAll(/command = "([^"]+)"/g)].map(match => match[1]);
  assert.equal(commands.length >= 2, true);
  for (const command of commands.slice(0, 2)) {
    const chrome = command.indexOf('node tools/bouw-v18-chrome-alles.mjs');
    const guard = command.indexOf('node tools/content-growth/publication-marker-build-guard.mjs');
    assert.notEqual(chrome, -1);
    assert.notEqual(guard, -1);
    assert.equal(guard > chrome, true);
  }
});
