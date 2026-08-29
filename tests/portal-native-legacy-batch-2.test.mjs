import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../portal/legacy-runtime.mjs', import.meta.url), 'utf8');
const intelligence = await readFile(new URL('../portal/render-intelligence.mjs', import.meta.url), 'utf8');
const impact = await readFile(new URL('../portal/render-impact.mjs', import.meta.url), 'utf8');

for (const id of ['aiscan','business','cijfers']) {
  test(`${id} bypasses the iframe bridge`, () => {
    assert.match(runtime, new RegExp(`['\"]${id}['\"]`));
  });
}

test('AI-scan kansenkaart renders natively in intelligence', () => {
  assert.match(intelligence, /intelligence\/legacy\/aiscan/);
  assert.match(intelligence, /AI-scan: kansenkaart/);
});

test('Businesscase and Cijfers en maatstaven render natively in impact', () => {
  assert.match(impact, /impact\/legacy\/business/);
  assert.match(impact, /Businesscase/);
  assert.match(impact, /impact\/legacy\/cijfers/);
  assert.match(impact, /Cijfers en maatstaven/);
});
