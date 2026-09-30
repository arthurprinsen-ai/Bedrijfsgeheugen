import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production build regenerates sitemap from final HTML output', async () => {
  const netlify = await readFile('netlify.toml', 'utf8');
  const marker = 'node tools/site-shell/build-localized-routes.mjs && node tools/genereer-sitemap.mjs && node tools/bouw-release-evidence.mjs';
  assert.ok(netlify.includes(marker), 'Netlify must generate sitemap after final localized routes and before release evidence');
});

test('explicit geenIndex views override inherited robots metadata', async () => {
  const source = await readFile('tools/bouw-v18-views.mjs', 'utf8');
  assert.match(source, /if \(p\.geenIndex\) \{/);
  assert.match(source, /robotsTag\.test\(html\)/);
  assert.match(source, /<meta name="robots" content="noindex, follow">/);
});

test('sitemap generator excludes noindex and only emits final canonical URLs', async () => {
  const source = await readFile('tools/genereer-sitemap.mjs', 'utf8');
  assert.match(source, /await finalizeSiteContracts\(\)/);
  assert.match(source, /if \(!html\.includes\('<body'\) \|\| noindex\(html\)\) continue/);
  assert.match(source, /const url = canonical\(html\)/);
  assert.match(source, /if \(!url\.startsWith\(\x60\$\{ORIGIN\}\//);
});
