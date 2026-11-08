import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyMiraSourceUrl} from '../supabase/functions/_shared/mira-source-url-quality.mjs';

const radar=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');

test('redirect- en zoekhosts worden geweigerd',()=>{
 for(const u of ['https://www.google.com/url?q=https://voorbeeld.nl/a','https://news.google.com/articles/x','https://www.bing.com/search?q=x','https://t.co/abc','https://voorbeeld.nl/out?url=https://x.nl','nonsens']){
  assert.equal(classifyMiraSourceUrl(u).ok,false,u);
 }
});
test('echte publicaties blijven toegestaan',()=>{
 for(const u of ['https://www.tweakers.net/nieuws/1.html','https://www.rtl.nl/nieuws/a','https://www.reddit.com/r/ondernemen/comments/1']){
  assert.equal(classifyMiraSourceUrl(u).ok,true,u);
 }
});
test('de originele radar past het filter toe vóór opslag',()=>{
 assert.match(radar,/from '..\/_shared\/mira-source-url-quality\.mjs'/);
 assert.match(radar,/classifyMiraSourceUrl\(sourceUrl\)\.ok/);
});
