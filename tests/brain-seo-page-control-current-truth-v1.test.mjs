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

test('SEO semantic checks stay on source truth while canonical shell has one authority', async()=>{
  const wf=await readFile('.github/workflows/paginacontrole.yml','utf8');
  const seo=await readFile('.github/scripts/seocontrole.py','utf8');
  assert.match(wf,/name: SEO en interne links controleren\n/);
  assert.doesNotMatch(wf,/SEO en interne links controleren op productiebuild/);
  assert.doesNotMatch(seo,/de menubalk wijkt af van \.github\/canoniek\/kop\.html/);
  assert.doesNotMatch(seo,/de voettekst wijkt af van \.github\/canoniek\/voet\.html/);
  assert.match(wf,/Data-soevereiniteit en ChatGPT-beleid \| Bedrijfsgeheugen/);
});
