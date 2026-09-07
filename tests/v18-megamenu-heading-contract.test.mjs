import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = await readFile(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');

test('V18 production builder owns the real megamenu heading visual contract', () => {
  assert.match(core, /v18-megamenu-heading-contract/);
  assert.match(core, /data-bg-megamenu-heading/);
  assert.match(core, /color:\s*#000\s*!important/);
  assert.match(core, /font-weight:\s*800\s*!important/);
  for (const label of ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT']) {
    assert.ok(core.includes(label), `missing megamenu heading contract for ${label}`);
  }
});

test('required deploy-preview gate verifies the actual visible megamenu headings', () => {
  assert.match(workflow, /v18-megamenu-browser-check\.mjs/);
  assert.match(workflow, /Verify real megamenu headings are black and bold/);
});
