import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../assets/cms-admin.js', import.meta.url), 'utf8');

test('CMS single and collection selector helpers remain distinct', () => {
  const single = source.match(/^var\s+([^=]+)=function\(s,r\).*querySelector\(s\)/m);
  const multi = source.match(/^var\s+([^=]+)=function\(s,r\).*querySelectorAll\(s\)/m);
  assert.ok(single);
  assert.ok(multi);
  assert.notEqual(single[1].trim(), multi[1].trim());
});

test('CMS data-area binding uses the collection helper', () => {
  const multi = source.match(/^var\s+([^=]+)=function\(s,r\).*querySelectorAll\(s\)/m);
  const binding = source.match(/^\s*([^\s(]+)\('\[data-area\]'\)\.forEach/m);
  assert.ok(multi);
  assert.ok(binding);
  assert.equal(binding[1].trim(), multi[1].trim());
});
