import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../portal/legacy-runtime.mjs', import.meta.url), 'utf8');
const company = await readFile(new URL('../portal/render-company.mjs', import.meta.url), 'utf8');
const memory = await readFile(new URL('../portal/render-memory.mjs', import.meta.url), 'utf8');
const decisions = await readFile(new URL('../portal/render-decisions.mjs', import.meta.url), 'utf8');

for (const id of ['mensen','wijzigingen','advies']) {
  test(`${id} bypasses the iframe bridge`, () => assert.match(runtime, new RegExp(`['\"]${id}['\"]`)));
}

test('Mensen renders natively in company', () => {
  assert.match(company, /company\/legacy\/mensen/);
  assert.match(company, />Mensen</);
});

test('Wijzigingen renders natively in memory', () => {
  assert.match(memory, /memory\/legacy\/wijzigingen/);
  assert.match(memory, />Wijzigingen</);
});

test('Advies renders natively in decisions', () => {
  assert.match(decisions, /decisions\/legacy\/advies/);
  assert.match(decisions, />Advies</);
});
