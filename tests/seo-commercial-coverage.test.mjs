import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRegistry } from '../tools/seo-order-engine/registry.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const REQUIRED_COMMERCIAL_ROUTES = [
  '/exact-online-koppeling',
  '/bedrijfsprocessen-automatiseren',
  '/systemen-koppelen',
  '/api-koppeling-laten-maken',
  '/webshop-koppeling',
  '/twinfield-koppeling',
  '/ai-implementeren',
  '/ai-governance',
  '/workshops',
  '/due-diligence'
].map(path => `${ORIGIN}${path}`);

const registry = JSON.parse(await readFile(new URL('../site/seo-order-map.json', import.meta.url), 'utf8'));

test('commercial registry has explicit SERP-fit and business-goal fields', () => {
  for (const entry of registry.pages) {
    assert.ok(['commercial', 'informational', 'mixed', 'navigational'].includes(entry.search_intent), `${entry.route} mist geldige search_intent`);
    assert.ok(['money', 'guide', 'pillar', 'trust', 'tool'].includes(entry.target_page_type), `${entry.route} mist geldige target_page_type`);
    assert.ok(['lead', 'assisted-conversion', 'trust', 'self-serve'].includes(entry.business_goal), `${entry.route} mist geldige business_goal`);
    assert.ok(Number.isInteger(entry.priority) && entry.priority >= 1 && entry.priority <= 5, `${entry.route} mist priority 1..5`);
  }
});

test('existing high-intent commercial pages have one explicit owner', () => {
  const routes = new Set(registry.pages.map(entry => entry.route));
  for (const route of REQUIRED_COMMERCIAL_ROUTES) assert.ok(routes.has(route), `${route} mist uit canonical intent registry`);
});

test('commercial SERP owners are money pages and never informational', () => {
  for (const entry of registry.pages.filter(entry => entry.search_intent === 'commercial')) {
    assert.equal(entry.role, 'money', `${entry.route} commercial intent moet money-role hebben`);
    assert.equal(entry.target_page_type, 'money', `${entry.route} commercial intent moet money target page type hebben`);
  }
});

test('registry validator enforces the commercial coverage contract', () => {
  assert.deepEqual(validateRegistry(registry), []);
});
