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
  assert.match(workflow, /data-soevereiniteit/);
});

test('promotion gate executes and interprets the full existing static SEO checker', () => {
  const workflow = read('.github/workflows/v18-production-promotion.yml');
  assert.match(workflow, /seo-promotion-gate\.mjs/);
  assert.match(workflow, /tests\/seo-production-guard\.test\.mjs/);
  assert.ok(existsSync('tools/seo-promotion-gate.mjs'), 'SEO promotion interpreter must exist');
  const gate = read('tools/seo-promotion-gate.mjs');
  assert.match(gate, /\.github\/scripts\/seocontrole\.py/);
  assert.match(gate, /visibleV18BodyIsImmutable/);
  assert.match(gate, /prototype-v18-stable/);
});

test('generated prototype cannot become a duplicate indexable production route', () => {
  const redirects = read('_redirects');
  assert.match(redirects, /^\/prototype-v18-stable\s+\/\s+301!/m);
  assert.match(redirects, /^\/prototype-v18-stable\.html\s+\/\s+301!/m);
});

test('data sovereignty title override stays within search result length without body rewrite', () => {
  const cfg = JSON.parse(read('site/seo-baseline.json'));
  const override = cfg.pageOverrides.find(x => x.route === '/data-soevereiniteit');
  assert.ok(override, 'data sovereignty SEO override missing');
  assert.ok(override.title.length >= 30 && override.title.length <= 65, `title length is ${override.title.length}`);
  assert.match(override.title.toLowerCase(), /data-soevereiniteit/);
  const apply = read('tools/apply-v18-seo.mjs');
  assert.match(apply, /applyPageOverride/);
  assert.match(apply, /changed visible body/);
});
