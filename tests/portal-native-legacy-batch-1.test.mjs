import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../portal/legacy-runtime.mjs', import.meta.url), 'utf8');
const company = await readFile(new URL('../portal/render-company.mjs', import.meta.url), 'utf8');
const memory = await readFile(new URL('../portal/render-memory.mjs', import.meta.url), 'utf8');

const firstNativeBatch = ['profiel', 'dataai', 'antwoorden'];

test('first legacy migration batch is explicitly native and bypasses iframe bridge', () => {
  assert.match(runtime, /NATIVE_LEGACY_WORKSPACES/);
  for (const id of firstNativeBatch) assert.match(runtime, new RegExp(`['\"]${id}['\"]`));
  assert.match(runtime, /NATIVE_LEGACY_WORKSPACES\.has\(/);
});

test('profile and data-ai legacy routes render natively in company domain', () => {
  assert.match(company, /legacy\/profiel/);
  assert.match(company, /Profiel per onderdeel/);
  assert.match(company, /legacy\/dataai/);
  assert.match(company, /Data en AI/);
});

test('legacy answers route renders natively in memory domain', () => {
  assert.match(memory, /legacy\/antwoorden/);
  assert.match(memory, /Wat je hebt ingevuld/);
});
