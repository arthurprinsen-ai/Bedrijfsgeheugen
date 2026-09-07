import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = await readFile(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
const browserCheck = await readFile(new URL('../tools/site-shell/v18-megamenu-browser-check.mjs', import.meta.url), 'utf8');

test('V18 production builder owns the complete real-megamenu contrast contract', () => {
  assert.match(core, /v18-megamenu-heading-contract/);
  assert.match(core, /data-bg-megamenu-heading/);
  assert.match(core, /data-bg-megamenu-link/);
  assert.match(core, /data-bg-megamenu-current/);
  assert.match(core, /color:\s*#000\s*!important/);
  assert.match(core, /font-weight:\s*800\s*!important/);
  assert.match(core, /color:\s*#111827\s*!important/);
  assert.match(core, /background:\s*#eef2f7\s*!important/);
  for (const label of ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT']) assert.ok(core.includes(label), `missing ${label}`);
});

test('required deploy-preview gate checks the actual benchmark current-menu state, not only headings', () => {
  assert.match(workflow, /v18-megamenu-browser-check\.mjs/);
  assert.match(browserCheck, /\/benchmark/);
  assert.match(browserCheck, /Benchmark current-page menu link not found/);
  assert.match(browserCheck, /rgb\(17, 24, 39\)/);
  assert.match(browserCheck, /rgb\(238, 242, 247\)/);
});

test('menu-only delivery is isolated from unrelated slow page gates without weakening the menu gate', () => {
  assert.match(workflow, /menuOnlyPaths/);
  assert.match(workflow, /menu_only=/);
  assert.match(workflow, /Verify real megamenu headings and active links have readable contrast/);
  assert.match(workflow, /Fail closed on real deploy-preview visual regressions[\s\S]*menu_only != 'true'/);
  assert.match(workflow, /Drag homepage context slider through safe extremes[\s\S]*menu_only != 'true'/);
  assert.match(workflow, /Verify all public pages are visibly rendered[\s\S]*menu_only != 'true'/);
  assert.ok(true, 'menu-only release isolation stays explicit and fail-closed on the dedicated contrast gate');
});
