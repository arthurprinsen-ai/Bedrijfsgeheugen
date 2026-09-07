import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('homepage build wires Platform/Expertise as a real accessible toggle', () => {
  const scriptPath = 'tools/bouw-v18-homepage-platform-expertise-toggle.mjs';
  assert.equal(existsSync(scriptPath), true, 'toggle build step is missing');

  const netlify = readFileSync('netlify.toml', 'utf8');
  const pricingPipeline = readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(netlify, /node tools\/prijzen-uit-de-homepage\.mjs/, 'pricing/page-policy pipeline is not in the production build');
  assert.match(pricingPipeline, /bouw-v18-homepage-platform-expertise-toggle\.mjs/, 'toggle fix is not part of the effective production build');

  const source = readFileSync(scriptPath, 'utf8');
  assert.match(source, /aria-selected/, 'toggle must expose selected state');
  assert.match(source, /aria-controls/, 'toggle buttons must point at their panels');
  assert.match(source, /keydown/, 'toggle must support keyboard navigation');
  assert.match(source, /AI-copilot/, 'Platform panel anchor is missing');
  assert.match(source, /Frisse Blik/, 'Expertise panel anchor is missing');
  assert.match(source, /hidden/, 'inactive panel must actually be hidden');
});

test('homepage toggle scopes the Platform button to the same local control as Expertise', () => {
  const source = readFileSync('tools/bouw-v18-homepage-platform-expertise-toggle.mjs', 'utf8');
  assert.match(source, /findLocalTogglePair/, 'toggle must resolve Platform and Expertise as a local pair');
  assert.doesNotMatch(
    source,
    /buttons\.find\(function\(b\)\{return txt\(b\)==='Platform';\}\)/,
    'document-wide first Platform button is unsafe because the navigation also contains Platform',
  );
  assert.match(source, /querySelectorAll\('button'\)/, 'local pair resolver must inspect buttons inside candidate ancestors');
});
