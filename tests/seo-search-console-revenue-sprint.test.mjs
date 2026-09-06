import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const map = JSON.parse(await readFile(new URL('../site/seo-order-map.json', import.meta.url), 'utf8'));
const byRoute = new Map(map.pages.map((page) => [page.route, page]));

function page(route) {
  const value = byRoute.get(`${ORIGIN}${route}`);
  assert.ok(value, `SEO order registry mist ${ORIGIN}${route}`);
  return value;
}

test('Search Console revenue sprint legt commerciële intent-eigenaren vast', () => {
  const expected = [
    ['/afas-koppeling', 'money', 'afas koppeling'],
    ['/exact-online-koppeling', 'money', 'exact online koppeling'],
    ['/bedrijfsprocessen-automatiseren', 'money', 'bedrijfsprocessen automatiseren'],
    ['/api-koppeling-laten-maken', 'money', 'api koppeling laten maken'],
    ['/twinfield-koppeling', 'money', 'twinfield koppeling'],
  ];

  for (const [route, role, primaryIntent] of expected) {
    const value = page(route);
    assert.equal(value.role, role, `${route} moet commerciële money-page zijn`);
    assert.equal(value.primary_intent, primaryIntent, `${route} heeft verkeerde primaire intent`);
    assert.equal(value.funnel_stage, 'decide', `${route} moet op beslisintentie sturen`);
    assert.equal(value.primary_cta?.url, `${ORIGIN}/frisse-blik`, `${route} moet naar de Frisse Blik CTA sturen`);
  }
});

test('AFAS Pocket ondersteunt de generieke AFAS money-page en kaapt de intent niet', () => {
  const pocket = page('/afas-pocket-koppelen');
  assert.equal(pocket.role, 'support');
  assert.equal(pocket.primary_intent, 'afas pocket koppelen');
  assert.equal(pocket.primary_keyword, 'afas pocket koppelen');
  assert.ok(
    pocket.supporting_routes?.includes(`${ORIGIN}/afas-koppeling`),
    'AFAS Pocket moet expliciet doorlinken naar de commerciële AFAS-koppelingpagina',
  );
  assert.equal(pocket.primary_cta?.url, `${ORIGIN}/afas-koppeling`);
});

test('iedere primaire intent heeft precies één eigenaar', () => {
  const intents = new Map();
  for (const item of map.pages) {
    const routes = intents.get(item.primary_intent) ?? [];
    routes.push(item.route);
    intents.set(item.primary_intent, routes);
  }

  const duplicates = [...intents.entries()].filter(([, routes]) => routes.length > 1);
  assert.deepEqual(duplicates, [], `Dubbele intent-eigenaren: ${JSON.stringify(duplicates)}`);
});

test('ieder primary en secondary keyword-cluster heeft precies één pagina-eigenaar', () => {
  const claims = new Map();
  for (const item of map.pages) {
    for (const keyword of [item.primary_keyword, ...(item.secondary_keywords ?? [])]) {
      const key = String(keyword).trim().toLocaleLowerCase('nl-NL');
      if (!key) continue;
      const owners = claims.get(key) ?? new Set();
      owners.add(item.route);
      claims.set(key, owners);
    }
  }
  const collisions = [...claims.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([keyword, owners]) => [keyword, [...owners]]);
  assert.deepEqual(collisions, [], `Keyword-cannibalisatie: ${JSON.stringify(collisions)}`);

  const processPage = page('/bedrijfsprocessen-automatiseren');
  assert.ok(processPage.secondary_keywords.includes('bedrijfsprocessen digitaliseren'));
  assert.ok(!page('/').secondary_keywords.includes('bedrijfsprocessen digitaliseren'));
});

test('alle revenue-sprint routes en CTA-links zijn absolute Bedrijfsgeheugen-URLs', () => {
  for (const route of [
    '/afas-koppeling',
    '/afas-pocket-koppelen',
    '/exact-online-koppeling',
    '/bedrijfsprocessen-automatiseren',
    '/api-koppeling-laten-maken',
    '/twinfield-koppeling',
  ]) {
    const value = page(route);
    assert.match(value.route, /^https:\/\/www\.bedrijfsgeheugen\.nl\//);
    assert.match(value.primary_cta.url, /^https:\/\/www\.bedrijfsgeheugen\.nl\//);
    for (const supportingRoute of value.supporting_routes ?? []) {
      assert.match(supportingRoute, /^https:\/\/www\.bedrijfsgeheugen\.nl\//);
    }
  }
});
