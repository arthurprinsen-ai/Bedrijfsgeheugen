import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = await readFile(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const browserCheck = await readFile(new URL('../tools/site-shell/v18-megamenu-browser-check.mjs', import.meta.url), 'utf8');

test('historical replay: sitewide V18 Meer menu geometry cannot drift per route', () => {
  assert.match(core, /data-bg-megamenu-root/);
  assert.match(core, /position:fixed!important/);
  assert.match(core, /left:50vw!important/);
  assert.match(core, /width:min\(1190px,calc\(100vw - 32px\)\)!important/);
  assert.match(core, /--bg-megamenu-top/);

  assert.match(browserCheck, /MEGAMENU_ROUTES/);
  for (const route of ['/', '/wijzigingen', '/prijzen', '/product', '/kennis/', '/over-ons']) {
    assert.ok(browserCheck.includes(route), `missing route in sitewide replay: ${route}`);
  }
  assert.match(browserCheck, /assertParity/);
  assert.match(browserCheck, /desktop navigation differs from homepage/);
  assert.match(browserCheck, /mega-menu width drifted/);
  assert.match(browserCheck, /mega-menu left edge drifted/);
});
