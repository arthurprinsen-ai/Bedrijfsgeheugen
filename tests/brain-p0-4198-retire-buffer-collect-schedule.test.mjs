import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../netlify/functions/buffer-social-collect.mjs',import.meta.url),'utf8');

test('legacy Buffer collector is not scheduled by Netlify',()=>{
  assert.doesNotMatch(src,/export\s+const\s+config\s*=\s*\{\s*schedule\s*:/);
  assert.match(src,/export\s+const\s+config\s*=\s*\{\s*\}/);
});
test('existing direct-call evidence path stays intact but never becomes an alternate social executor',()=>{
  assert.match(src,/export\s+default\s+async\s+function\s+bufferCollect/);
  assert.match(src,/runBufferCollection/);
  assert.match(src,/createSocialOutcomeHandler/);
  assert.match(src,/createSocialLearningStore/);
  assert.doesNotMatch(src,/schedule\s*:\s*['"][^'"]+['"]/);
});
