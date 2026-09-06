import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../assets/stijl.js', import.meta.url), 'utf8');

const routes = [
  '/afas-koppeling','/exact-online-koppeling','/twinfield-koppeling','/webshop-koppeling',
  '/systemen-koppelen','/frisse-blik','/ai-scan','/ai-adoptie','/due-diligence',
  '/bedrijfsprocessen-automatiseren','/prijzen'
];

test('shared conversion layer covers every registered live money page', () => {
  for (const route of routes) assert.match(js, new RegExp(route.replaceAll('/', '\\/')));
});

test('money-page contract exposes hero decision strip and final decision block', () => {
  assert.match(js, /bg-money-hero/);
  assert.match(js, /bg-money-decision/);
  assert.match(js, /data-bg-money-contract/);
});

test('conversion layer tracks view and both CTA choices', () => {
  assert.match(js, /money_page_view/);
  assert.match(js, /money_page_primary_cta/);
  assert.match(js, /money_page_secondary_cta/);
});

test('conversion copy includes price, proof, objection and ownership risk reversal fields', () => {
  for (const field of ['price','proof','objection','ownership']) assert.match(js, new RegExp(field + ':'));
});
