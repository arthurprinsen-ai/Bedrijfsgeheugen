import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const blocked=[/\bwaardevol\b/i,/\bimplementatie\b/i,/\boptimaliseren\b/i,/\boptimalisatie\b/i];
for (const path of ['prijzen.html','product.html']) {
  test(`${path} contains no blocked brand-language terms`, async () => {
    const html=await readFile(path,'utf8');
    for (const word of blocked) assert.doesNotMatch(html,word);
  });
}
