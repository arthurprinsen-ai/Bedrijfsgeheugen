import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = await readFile(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const browserCheck = await readFile(new URL('../tools/site-shell/v18-megamenu-browser-check.mjs', import.meta.url), 'utf8');
const required = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');

async function readProductionReadback() {
  try {
    return await readFile(new URL('../.github/workflows/v18-megamenu-production-readback.yml', import.meta.url), 'utf8');
  } catch {
    return '';
  }
}

test('real V18 megamenu owns heading and ordinary-link contrast contract', () => {
  assert.match(core, /data-bg-megamenu-heading/);
  assert.match(core, /data-bg-megamenu-link/);
  assert.match(core, /color:\s*#000\s*!important/);
  assert.match(core, /font-weight:\s*800\s*!important/);
  assert.match(core, /font-weight:\s*700\s*!important/);
  assert.match(core, /isPromoLink/);
});

test('dedicated browser gate proves headings and ordinary links are readable', () => {
  assert.match(browserCheck, /ordinaryLinks/);
  assert.match(browserCheck, /rgb\(0, 0, 0\)/);
  assert.match(browserCheck, /expected bold >=700/);
  assert.match(browserCheck, /MENSEN EERST\. DAN TECHNIEK\./);
});

test('required PR gate always includes the dedicated megamenu contrast check', () => {
  assert.match(required, /v18-megamenu-browser-check\.mjs/);
});

test('production readback rechecks the real site after main deploy', async () => {
  const productionReadback = await readProductionReadback();
  assert.match(productionReadback, /push:/);
  assert.match(productionReadback, /branches:\s*\[main\]/);
  assert.match(productionReadback, /https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(productionReadback, /v18-megamenu-browser-check\.mjs/);
});
