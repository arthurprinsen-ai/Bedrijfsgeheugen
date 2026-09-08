import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../compliance.html', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('compliance audit page exposes risk, next-step and print/PDF controls', () => {
  assert.match(page, /AI Act/);
  assert.match(page, /NIS2/);
  assert.match(page, /Open risico’s/);
  assert.match(page, /Volgende stappen/);
  assert.match(page, /Print \/ PDF/);
  assert.match(page, /window\.print\(\)/);
});

test('portal dashboard exposes compliance audit view through an absolute URL', () => {
  assert.match(dashboard, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/compliance\.html"/);
  assert.match(dashboard, /Compliance & audit/);
});
