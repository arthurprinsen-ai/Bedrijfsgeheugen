import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = await readFile(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
const browserCheck = await readFile(new URL('../tools/site-shell/v18-megamenu-browser-check.mjs', import.meta.url), 'utf8');

async function readProductionReadback() {
  try {
    return await readFile(new URL('../.github/workflows/v18-megamenu-production-readback.yml', import.meta.url), 'utf8');
  } catch {
    return '';
  }
}

test('V18 production builder owns the complete real-megamenu contrast contract', () => {
  assert.match(core, /v18-megamenu-contrast-contract/);
  assert.match(core, /data-bg-megamenu-heading/);
  assert.match(core, /data-bg-megamenu-link/);
  assert.match(core, /color:\s*#000\s*!important/);
  assert.match(core, /font-weight:\s*800\s*!important/);
  assert.match(core, /font-weight:\s*700\s*!important/);
  assert.match(core, /isPromoLink/);
  for (const label of ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT']) assert.ok(core.includes(label), `missing ${label}`);
});

test('required deploy-preview gate checks headings and ordinary menu links', () => {
  assert.match(workflow, /v18-megamenu-browser-check\.mjs/);
  assert.match(browserCheck, /ordinaryLinks/);
  assert.match(browserCheck, /expected black/);
  assert.match(browserCheck, /expected bold >=700/);
  assert.match(browserCheck, /MENSEN EERST\. DAN TECHNIEK\./);
});

test('production readback verifies the same contrast contract on the real site', async () => {
  const productionReadback = await readProductionReadback();
  assert.match(productionReadback, /push:/);
  assert.match(productionReadback, /branches:\s*\[main\]/);
  assert.match(productionReadback, /https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(productionReadback, /v18-megamenu-browser-check\.mjs/);
});
