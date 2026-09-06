import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('portal-v2 has structured-data prerequisites before estate SEO enrichment',()=>{
  assert.match(html,/<title>[^<]+<\/title>/i);
  assert.match(html,/<meta\s+name="description"\s+content="[^"]+"\s*\/?\s*>/i);
});
