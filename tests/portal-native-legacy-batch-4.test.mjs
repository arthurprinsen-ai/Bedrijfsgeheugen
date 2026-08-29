import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../portal/legacy-runtime.mjs', import.meta.url), 'utf8');
const intelligence = await readFile(new URL('../portal/render-intelligence.mjs', import.meta.url), 'utf8');
const admin = await readFile(new URL('../portal/render-admin.mjs', import.meta.url), 'utf8');

for (const id of ['branche','onderzoek','beleid']) {
  test(`${id} bypasses the iframe bridge`, () => assert.match(runtime, new RegExp(`['\"]${id}['\"]`)));
}

test('Branche en markt renders natively in intelligence', () => {
  assert.match(intelligence, /intelligence\/legacy\/branche/);
  assert.match(intelligence, /Branche en markt/);
});

test('Onderzoek renders natively in intelligence', () => {
  assert.match(intelligence, /intelligence\/legacy\/onderzoek/);
  assert.match(intelligence, />Onderzoek</);
});

test('Compliance security governance renders natively in admin', () => {
  assert.match(admin, /admin\/legacy\/beleid/);
  assert.match(admin, /Compliance, security en governance/);
});
