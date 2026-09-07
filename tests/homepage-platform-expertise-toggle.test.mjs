import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('homepage build wires Platform/Expertise as a real accessible toggle', () => {
  const scriptPath = 'tools/fix-homepage-platform-expertise-toggle.mjs';
  assert.equal(existsSync(scriptPath), true, 'toggle build step is missing');

  const netlify = readFileSync('netlify.toml', 'utf8');
  assert.match(netlify, /node tools\/fix-homepage-platform-expertise-toggle\.mjs/, 'toggle fix is not part of the production build');

  const source = readFileSync(scriptPath, 'utf8');
  assert.match(source, /aria-selected/, 'toggle must expose selected state');
  assert.match(source, /aria-controls/, 'toggle buttons must point at their panels');
  assert.match(source, /keydown/, 'toggle must support keyboard navigation');
  assert.match(source, /AI-copilot/, 'Platform panel anchor is missing');
  assert.match(source, /Frisse Blik/, 'Expertise panel anchor is missing');
  assert.match(source, /hidden/, 'inactive panel must actually be hidden');
});