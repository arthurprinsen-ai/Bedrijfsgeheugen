import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('production SEO guard verifies the real public site after deploy', () => {
  assert.ok(existsSync('.github/workflows/production-seo-smoke.yml'), 'production SEO smoke workflow must exist');
  const workflow = read('.github/workflows/production-seo-smoke.yml');
  assert.match(workflow, /https:\/\/www\.bedrijfsgeheugen\.nl\//);
  assert.match(workflow, /BG_PERSISTENT_SEO_V1/);
  assert.match(workflow, /site\/seo-baseline\.json/);
  assert.match(workflow, /robots\.txt/);
  assert.match(workflow, /sitemap\.xml/);
  assert.match(workflow, /view-home/);
  assert.match(workflow, /view-product/);
  assert.match(workflow, /noindex\|nofollow/i);
});

test('promotion gate executes the full existing static SEO checker', () => {
  const workflow = read('.github/workflows/v18-production-promotion.yml');
  assert.match(workflow, /\.github\/scripts\/seocontrole\.py/);
  assert.match(workflow, /tests\/seo-production-guard\.test\.mjs/);
});
