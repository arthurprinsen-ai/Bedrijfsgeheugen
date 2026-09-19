import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('current SEO cleanup removes known #1448 source findings', async()=>{
  const prijzen=await readFile('prijzen.html','utf8');
  const product=await readFile('product.html','utf8');
  const data=await readFile('data-soevereiniteit.html','utf8');
  assert.doesNotMatch(prijzen,/\bimplementatie\b/i);
  assert.doesNotMatch(product,/\boptimaliseren\b|\boptimalisatie\b/i);
  const title=(data.match(/<title>([^<]*)<\/title>/i)||[])[1]||'';
  assert.ok(title.length<=65, `data title length ${title.length}`);
  const desc=(prijzen.match(/<meta name="description" content="([^"]*)"/i)||[])[1]||'';
  assert.ok(desc.length>=110 && desc.length<=165, `pricing description length ${desc.length}`);
});

test('SEO strategy checker uses the same production-projected tree as page checks', async()=>{
  const wf=await readFile('.github/workflows/paginacontrole.yml','utf8');
  assert.match(wf,/SEO en interne links controleren op productiebuild/);
  assert.match(wf,/working-directory: \$\{\{ runner\.temp \}\}\/site/);
  assert.match(wf,/Data-soevereiniteit en ChatGPT-beleid \| Bedrijfsgeheugen/);
});
