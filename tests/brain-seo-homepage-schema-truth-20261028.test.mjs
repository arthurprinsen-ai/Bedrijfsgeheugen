import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (name) => readFile(new URL('../' + name, import.meta.url), 'utf8');
const home = await read('index.html');
const prices = await read('prijzen.html');
const match = home.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/);
assert.ok(match, 'homepage JSON-LD exists');
const graph = JSON.parse(match[1])['@graph'];
const ofType = (type) => graph.filter((node) => node['@type'] === type);

test('homepage does not advertise sibling destinations as a breadcrumb hierarchy', () => {
  assert.equal(ofType('BreadcrumbList').length, 0, 'home has no child-page breadcrumb trail');
  assert.match(home, /<link rel="canonical" href="https:\\/\\/www\\.bedrijfsgeheugen\\.nl\\/">/);
});

test('software offer data never contradicts visible current subscription pricing', () => {
  assert.match(prices, /Starter €99, Pro €299, Groei €749/);
  const app = ofType('SoftwareApplication')[0];
  assert.ok(app, 'existing software application entity remains');
  assert.equal(app.offers, undefined, 'no stale €1495-€4995 aggregate offer');
  assert.equal(app.url, 'https://www.bedrijfsgeheugen.nl/product');
});

test('remove only unsupported claims; preserve real organization and website identity', () => {
  assert.equal(ofType('ProfessionalService').length, 1);
  assert.equal(ofType('WebSite').length, 1);
  assert.equal(ofType('Person').length, 1);
  assert.equal(ofType('FAQPage').length, 1);
  assert.equal(graph.length, 5);
});
