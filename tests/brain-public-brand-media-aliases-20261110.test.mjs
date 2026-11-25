import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');
function alias(path){return redirects.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')).find(s=>s.split(/\s+/)[0]===path)?.split(/\s+/)||null;}
test('missing OG image URL resolves to an existing branded media asset through one permanent internal redirect',()=>{
 const r=alias('/og-image.png');
 assert.deepEqual(r,['/og-image.png','/assets/merk/banner-instagram-tegel.jpg','301!']);
 assert.ok(existsSync(new URL('../assets/merk/banner-instagram-tegel.jpg',import.meta.url)));
 assert.equal(redirects.split(/\r?\n/).filter(x=>/^\/og-image\.png\s/.test(x)).length,1);
 const homepage=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(homepage,/\/og-image\.png/);
});
test('browser favicon.ico resolves to real root favicon.png, not generic 404 HTML',()=>{
 const r=alias('/favicon.ico');
 assert.deepEqual(r,['/favicon.ico','/favicon.png','301!']);
 assert.ok(existsSync(new URL('../favicon.png',import.meta.url)));
 assert.equal(redirects.split(/\r?\n/).filter(x=>/^\/favicon\.ico\s/.test(x)).length,1);
});
test('brand asset aliases cannot redirect external provider requests or cross-tenant private data',()=>{
 for(const path of ['/og-image.png','/favicon.ico']){
  const r=alias(path);assert.equal(r.length,3);assert.ok(r[1].startsWith('/'));
  assert.doesNotMatch(r[1],/^\/\//);
  assert.doesNotMatch(r[1],/api|private|portal|tenant|https?:/i);
 }
});
