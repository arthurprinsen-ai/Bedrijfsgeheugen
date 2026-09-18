import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('roadmap manual workspace attaches legacy parity evidence used by production readback',()=>{
  const source=fs.readFileSync(new URL('../portal-v2/page-shell.js',import.meta.url),'utf8');
  assert.match(source,/pageId==='roadmap'[\s\S]*delegate:false,attachLegacyParity:true/);
});
