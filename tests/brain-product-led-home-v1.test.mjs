import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apply = readFileSync('tools/site-shell/apply-product-led-home.mjs','utf8');
const netlify = readFileSync('netlify.toml','utf8');
const skill = readFileSync('skills/powerhouse-product-led-growth.md','utf8');

test('product-led homepage presents one platform with three product lines', () => {
  assert.match(apply,/Powerhouse · één platform/);
  assert.match(apply,/Powerhouse Intelligence/);
  assert.match(apply,/Powerhouse Agents/);
  assert.match(apply,/Powerhouse Connect/);
  assert.match(apply,/Data[\s\S]*Context[\s\S]*Intelligence[\s\S]*Beslissing[\s\S]*Actie[\s\S]*Bewijs[\s\S]*Leren/);
});

test('homepage product architecture is part of production and preview builds', () => {
  const uses = netlify.match(/node tools\/site-shell\/apply-product-led-home\.mjs/g) || [];
  assert.ok(uses.length >= 2, 'production and deploy-preview must both apply the product-led homepage');
  assert.doesNotMatch(apply,/prototype-v18-stable\.html/);
});

test('product-led homepage links use full canonical URLs', () => {
  for (const href of [
    'https://www.bedrijfsgeheugen.nl/product',
    'https://www.bedrijfsgeheugen.nl/ai-ecosysteem',
    'https://www.bedrijfsgeheugen.nl/systemen-koppelen',
    'https://www.bedrijfsgeheugen.nl/zelfscan',
  ]) assert.ok(apply.includes(`href="${href}"`), `missing canonical href: ${href}`);
  assert.doesNotMatch(apply,/href="\//);
  assert.doesNotMatch(apply,/Powerhouse closed loop/);
  assert.match(apply,/Context[\s\S]*Powerhouse Intelligence[\s\S]*Beslissing/);
});

test('growth skill preserves product-led architecture', () => {
  assert.match(skill,/Intelligence → Agents → Connect/);
  assert.match(skill,/product-led/i);
  assert.match(skill,/self-service/i);
});
