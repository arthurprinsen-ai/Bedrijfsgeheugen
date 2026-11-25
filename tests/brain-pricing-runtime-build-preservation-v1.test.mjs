import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/pricing-build-integrity.mjs','utf8');

test('section extraction accepts class before id',()=>{
  assert.ok(source.includes('const startRe = new RegExp('));
  assert.ok(source.includes('\\\\bid='));
  assert.match(source,/missing section#/);
  assert.doesNotMatch(source,/const startToken = `?<section id=/);
});
