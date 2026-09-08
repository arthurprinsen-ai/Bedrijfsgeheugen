import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Portal V2 exposes a premium SaaS visual system and brain flow contract', async () => {
  const [css, html] = await Promise.all([
    read('portal-v2/app.css'),
    read('portal-v2/index.html'),
  ]);

  assert.match(css, /--saas-accent:/);
  assert.match(css, /--saas-glow:/);
  assert.match(css, /\.brainflow/);
  assert.match(css, /\.brainnode/);
  assert.match(css, /\.braincapchips/);
  assert.match(html, /class="brainflow"/);
  assert.match(html, /class="brainnode[^\"]*"[^>]*data-stage="sources"/);
  assert.match(html, /data-stage="datahub"/);
  assert.match(html, /data-stage="brain"/);
  assert.match(html, /data-stage="powerhouse"/);
  assert.match(html, /data-stage="outcomes"/);
});

test('CSRD mobile layout is card-first and does not depend on shrinking the desktop world visual', async () => {
  const [css, js] = await Promise.all([
    read('portal-v2/csrd-impact.css'),
    read('portal-v2/csrd-impact.js'),
  ]);

  assert.match(js, /csrd-mobile-summary/);
  assert.match(js, /csrd-mobile-domain/);
  assert.match(css, /\.csrd-mobile-summary/);
  assert.match(css, /\.csrd-mobile-domain/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.csrd-world\s*\{[^}]*display:none/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*\.csrd-mobile-summary\s*\{[^}]*display:grid/);
  assert.match(css, /@media\(max-width:720px\)[\s\S]*min-height:44px/);
});
