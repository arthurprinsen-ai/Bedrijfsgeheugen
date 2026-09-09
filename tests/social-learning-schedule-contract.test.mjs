import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('social learning evaluator is scheduled natively and does not require Make',()=>{
  const toml=fs.readFileSync(new URL('../netlify.toml',import.meta.url),'utf8');
  assert.match(toml,/\[functions\."social-learning-evaluate"\]/);
  assert.match(toml,/schedule\s*=\s*"[^"]+"/);
  const fn=fs.readFileSync(new URL('../netlify/functions/social-learning-evaluate.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(fn,/make\.com|runScenario|BG199|BG184/);
});
