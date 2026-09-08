import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const website = await readFile('.github/workflows/lane-website.yml','utf8');
const portal = await readFile('.github/workflows/lane-portal.yml','utf8');
const promotion = await readFile('.github/workflows/v18-production-promotion.yml','utf8');

test('V18 website production contracts are routed through website lane', () => {
  assert.match(website, /tests\/v18-production-promotion\.test\.mjs/);
  assert.match(website, /tests\/v18-seo-layer\.test\.mjs/);
});

test('V18 portal production contracts remain covered by portal lane wildcard', () => {
  assert.match(portal, /tests\/portal-\*\.test\.mjs/);
});

test('V18 promotion no longer owns a PR runner', () => {
  assert.doesNotMatch(promotion, /(^|\n)\s{0,2}pull_request\s*:/m);
  assert.match(promotion, /automation\/v18-production-promotion/);
});