import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../netlify/functions/connector-readiness.mjs', import.meta.url), 'utf8');

test('connector readiness uses runtime-safe Netlify env authority', () => {
  assert.match(source, /globalThis\.Netlify\?\.env\?\.get\?\./);
});

test('connector readiness does not bootstrap the full connector execution engine', () => {
  assert.doesNotMatch(source, /connector-runtime\.mjs/);
});

test('connector readiness keeps the canonical public route and JSON response', () => {
  assert.match(source, /\/api\/connectors\/readiness/);
  assert.match(source, /application\/json/);
});
