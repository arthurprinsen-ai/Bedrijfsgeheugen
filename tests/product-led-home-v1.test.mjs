import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apply = readFileSync('tools/site-shell/apply-product-led-home.mjs','utf8');
const netlify = readFileSync('netlify.toml','utf8');
const runner = readFileSync('tools/ci/run-netlify-production-build.mjs','utf8');
const skill = readFileSync('skills/powerhouse-product-led-growth.md','utf8');

test('product-led homepage presents one platform with three product lines', () => {
  assert.match(apply,/Powerhouse · één platform/);
  assert.match(apply,/Powerhouse Intelligence/);
  assert.match(apply,/Powerhouse Agents/);
  assert.match(apply,/Powerhouse Connect/);
  assert.match(apply,/Data[\s\S]*Context[\s\S]*Intelligence[\s\S]*Beslissing[\s\S]*Actie[\s\S]*Bewijs[\s\S]*Leren/);
});

test('homepage product architecture is part of the canonical production and preview build', () => {
  assert.match(runner,/apply-product-led-home\.mjs/);
  assert.match(netlify,/\[build\][\s\S]*command = "node tools\/ci\/run-netlify-production-build\.mjs"/);
  assert.match(netlify,/\[context\.deploy-preview\][\s\S]*command = "node tools\/ci\/run-netlify-production-build\.mjs"/);
});

test('growth skill preserves product-led architecture', () => {
  assert.match(skill,/Intelligence → Agents → Connect/);
  assert.match(skill,/product-led/i);
  assert.match(skill,/self-service/i);
});
