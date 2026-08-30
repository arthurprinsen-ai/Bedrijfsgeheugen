import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const read = p => readFileSync(p, 'utf8');
const sha = s => createHash('sha256').update(s).digest('hex');
const bodyOf = html => (html.match(/<body\b[^>]*>[\s\S]*<\/body>/i) || [''])[0];

test('historical V18 has a separate persistent SEO contract', () => {
  assert.ok(existsSync('site/seo-baseline.json'), 'site/seo-baseline.json must exist');
  assert.ok(existsSync('tools/apply-v18-seo.mjs'), 'SEO applicator must exist');
  const cfg = JSON.parse(read('site/seo-baseline.json'));
  assert.equal(cfg.schemaVersion, 1);
  assert.equal(cfg.home.route, '/');
  assert.equal(cfg.home.canonical, 'https://www.bedrijfsgeheugen.nl/');
  assert.ok(cfg.home.title.length >= 30 && cfg.home.title.length <= 65);
  assert.ok(cfg.home.description.length >= 100 && cfg.home.description.length <= 165);
  assert.equal(cfg.home.primaryKeyword, 'digitalisering mkb');
  assert.ok(Array.isArray(cfg.keywordOwners) && cfg.keywordOwners.length >= 8);
  const keys = cfg.keywordOwners.map(x => x.keyword);
  assert.equal(new Set(keys).size, keys.length, 'primary keywords must be unique');
});

test('production build applies SEO only after the pinned historical V18 core', () => {
  const wrapper = read('tools/bouw-v18-production.mjs');
  const coreAt = wrapper.indexOf("bouw-v18-production-core.mjs");
  const seoAt = wrapper.indexOf("apply-v18-seo.mjs");
  assert.ok(coreAt >= 0, 'historical core import missing');
  assert.ok(seoAt > coreAt, 'SEO layer must run after historical core');
});

test('SEO layer changes head metadata without changing the visible V18 body', () => {
  let r = spawnSync(process.execPath, ['tools/bouw-v18-production-core.mjs'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const before = read('index.html');
  const beforeBody = bodyOf(before);
  assert.ok(beforeBody.length > 1000, 'historical V18 body missing');

  r = spawnSync(process.execPath, ['tools/apply-v18-seo.mjs'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const after = read('index.html');
  assert.equal(sha(bodyOf(after)), sha(beforeBody), 'SEO layer changed visible body');

  const cfg = JSON.parse(read('site/seo-baseline.json')).home;
  assert.match(after, new RegExp(`<title>${cfg.title.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}</title>`));
  assert.match(after, /<meta name="description" content="[^"]+">/);
  assert.match(after, /<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">/);
  assert.match(after, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/">/);
  assert.match(after, /<meta property="og:title"/);
  assert.match(after, /<meta property="og:description"/);
  assert.match(after, /<meta property="og:url"/);
  assert.match(after, /<meta property="og:image"/);
  assert.match(after, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(after, /<script type="application\/ld\+json" id="bg-seo-schema">/);
  assert.doesNotMatch(after, /noindex|nofollow/i);
  assert.equal((after.match(/<link rel="canonical"/g) || []).length, 1, 'canonical must be unique');
  assert.equal((after.match(/<title>/g) || []).length, 1, 'title must be unique');
});
