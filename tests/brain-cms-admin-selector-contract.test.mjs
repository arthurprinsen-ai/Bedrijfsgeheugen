import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/cms-admin.js',import.meta.url),'utf8');

test('CMS admin keeps separate single and multi selector helpers',()=>{
  assert.match(source,/var \$=function\(s,r\)\{return \(r\|\|document\)\.querySelector\(s\)\}/);
  assert.match(source,/var all=function\(s,r\)\{return Array\.from\(\(r\|\|document\)\.querySelectorAll\(s\)\)\}/);
  assert.doesNotMatch(source,/var \$=function\(s,r\)\{return \[\.\.\.\(r\|\|document\)\.querySelectorAll/);
  assert.match(source,/all\('\.row\[data-id\]'\)/);
  assert.match(source,/all\('\[data-area\]'\)\.forEach/);
  assert.doesNotMatch(source,/\$\('\[data-area\]'\)\.forEach/);
});

test('CMS event binder resolves one element before addEventListener',()=>{
  assert.match(source,/function on\(s,event,handler\)\{var el=\$\(s\);if\(el\)el\.addEventListener/);
});
