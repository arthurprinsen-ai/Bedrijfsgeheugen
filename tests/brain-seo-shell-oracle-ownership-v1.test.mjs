import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('SEO checker does not duplicate canonical shell truth with raw HTML equality', async()=>{
  const seo=await readFile('.github/scripts/seocontrole.py','utf8');
  assert.match(seo,/canonical shell ownership/i);
  assert.doesNotMatch(seo,/de menubalk wijkt af van \.github\/canoniek\/kop\.html/);
  assert.doesNotMatch(seo,/de voettekst wijkt af van \.github\/canoniek\/voet\.html/);
  assert.doesNotMatch(seo,/CANONIEK_KOP\s*=/);
  assert.doesNotMatch(seo,/CANONIEK_VOET\s*=/);

  const canonical=await readFile('tools/controleer-site-ui.mjs','utf8');
  assert.match(canonical,/verifyPageShell\(html, bestand\)/);
  assert.match(canonical,/verifyGlobalComponentHashes\(paginas\)/);
});
