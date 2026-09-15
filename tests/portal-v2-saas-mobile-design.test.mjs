import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Portal V2 exposes a premium SaaS visual system and brain flow contract', async () => {
  const [css, html] = await Promise.all([
    read('portal-v2/saas-theme.css'),
    read('portal-v2/index.html'),
  ]);

  assert.match(css, /--saas-accent:/);
  assert.match(css, /--saas-glow:/);
  assert.match(css, /\.brainflow/);
  assert.match(css, /\.brainnode/);
  assert.match(css, /\.braincapchips/);
  assert.match(html, /href="\.\/saas-theme\.css"/);
  assert.match(html, /class="brainflow"/);
  assert.match(html, /class="brainnode[^\"]*"[^>]*data-stage="sources"/);
  assert.match(html, /data-stage="datahub"/);
  assert.match(html, /data-stage="brain"/);
  assert.match(html, /data-stage="powerhouse"/);
  assert.match(html, /data-stage="outcomes"/);
});

test('CSRD mobile layout is card-first and critical mobile styles load before hydration', async () => {
  const [css, js, html] = await Promise.all([
    read('portal-v2/csrd-mobile-saas.css'),
    read('portal-v2/csrd-impact.js'),
    read('portal-v2/index.html'),
  ]);

  const csrdStyle = '<link rel="stylesheet" href="./csrd-mobile-saas.css">';
  const mobileStyle = '<link rel="stylesheet" href="./mobile-responsive.css">';
  const appScript = '<script type="module" src="./app.js"></script>';
  const csrdStyleIndex = html.indexOf(csrdStyle);
  const mobileStyleIndex = html.indexOf(mobileStyle);
  const appScriptIndex = html.indexOf(appScript);

  assert.ok(csrdStyleIndex >= 0, 'CSRD mobile SaaS stylesheet must be statically linked');
  assert.ok(mobileStyleIndex > csrdStyleIndex, 'global mobile contract must load after CSRD mobile overrides');
  assert.ok(appScriptIndex > mobileStyleIndex, 'critical mobile styles must be loaded before app hydration starts');
  assert.doesNotMatch(html, /DOMContentLoaded[\s\S]*csrd-mobile-saas\.css/);
  assert.doesNotMatch(html, /document\.head\.appendChild\(style\)[\s\S]*csrd-mobile-saas\.css/);
  assert.match(js, /csrd-mobile-summary/);
  assert.match(js, /csrd-mobile-domain/);
  assert.match(css, /\.csrd-mobile-summary/);
  assert.match(css, /\.csrd-mobile-domain/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.csrd-world\s*\{[^}]*display:none/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.csrd-mobile-summary\s*\{[^}]*display:grid/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*min-height:44px/);
});
