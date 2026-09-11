import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');

test('Portal V2 starts behind a boot guard instead of showing generic overview content first',()=>{
  assert.match(html,/<body[^>]*class="[^"]*v2-booting[^"]*"/);
  assert.match(html,/id="portalBoot"/);
  assert.match(html,/\.v2-booting\s+\.app\s*\{[^}]*visibility\s*:\s*hidden/i);
});

test('Portal V2 removes the boot guard only after the first domain-state load has settled',()=>{
  assert.match(app,/portalDomainState\.init\(\)/);
  assert.match(app,/document\.body\.classList\.remove\(['"]v2-booting['"]\)/);
});
