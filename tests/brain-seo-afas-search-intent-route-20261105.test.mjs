import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const service = readFileSync('afas-koppeling.html', 'utf8');
const cost = readFileSync('blog/wat-kost-een-afas-koppeling/index.html', 'utf8');
const baseline = JSON.parse(readFileSync('site/seo-baseline.json', 'utf8'));
const canonical = 'https://www.bedrijfsgeheugen.nl/afas-koppeling';

test('AFAS service owns its transactional keyword, not the pricing query', () => {
  assert.match(service, /<meta name="bg-zoekwoord" content="afas koppeling">/);
  assert.match(cost, /<meta name="bg-zoekwoord" content="AFAS koppeling kosten">/);
  assert.ok(baseline.keywordOwners.some(item => item.keyword === 'afas koppeling' && item.route === '/afas-koppeling'));
  assert.ok(baseline.keywordOwners.some(item => item.keyword === 'afas koppeling kosten' && item.route === '/blog/wat-kost-een-afas-koppeling/'));
});

test('search intent from AFAS pricing guides prospects to the canonical service', () => {
  assert.match(service, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/afas-koppeling">/);
  assert.match(service, /<h3>AFAS webshop koppeling: bestellingen zonder overtypen<\/h3>/);
  assert.match(service, /Lightspeed koppelen aan AFAS Profit/);
  assert.match(cost, new RegExp('<a href="' + canonical.replaceAll('.', '\\.') + '">AFAS webshop koppeling laten maken<\\/a>'));
  assert.match(cost, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/wat-kost-een-afas-koppeling\/">/);
});
