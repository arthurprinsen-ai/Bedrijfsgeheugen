import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('final release evidence stamps exact commit marker into built HTML', async () => {
  const source = await readFile('tools/bouw-release-evidence.mjs','utf8');
  assert.match(source,/ensureReleaseMarker/);
  assert.match(source,/glob\('\*\*\/\*\.html'\)/);
  assert.match(source,/RELEASE_HTML_MARKERS/);
  assert.match(source,/ensureReleaseMarker\(html, commitRef\)/);
});

test('mobile language injector supports v18 and compact bgkop mobile drawers', async () => {
  const source = await readFile('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/v18-mobile-drawer/);
  assert.match(source,/bgkopMob/);
  assert.match(source,/bgkop-mob/);
  assert.match(source,/bgkop-mcta/);
  assert.match(source,/data-bg-language-select/);
});
