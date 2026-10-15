import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path=new URL('../config/bg-static-i18n-en.d/powerhouse-blog-2026-10-15.json',import.meta.url);
const patch=JSON.parse(readFileSync(path,'utf8'));
const entries=Object.entries(patch);
const numbers=s=>String(s).match(/(?:€\s*)?\d+(?:[.,-]\d+)*/g)||[];
const urls=s=>String(s).match(/https?:\/\/[^\s]+/g)||[];

test('all 25 exact Dutch source keys have distinct nonempty English translations',()=>{
  assert.equal(entries.length,25);
  for(const [source,english] of entries){
    assert.equal(typeof english,'string');
    assert.ok(source.trim().length>=15);
    assert.ok(english.trim().length>=5);
    assert.notEqual(source,english);
    assert.ok(!english.includes('TODO'));
  }
});
test('source-specific numbers, amounts, dates and URLs are retained',()=>{
  for(const [source,english] of entries){
    for(const number of numbers(source))assert.ok(english.includes(number),'Missing number '+number+' in translation for '+source.slice(0,48));
    for(const url of urls(source))assert.ok(english.includes(url),'Missing original URL for '+source.slice(0,48));
  }
});
test('blog SEO and approved attributed facts remain present in EN translation',()=>{
  assert.ok(entries.some(([k,v])=>k.includes('Digitalisering MKB: wat verandert') && v.includes('SME digitalization')));
  assert.ok(entries.some(([k,v])=>k.includes('TKI Bouw en Techniek') && v.includes('€3 million') && v.includes('Bouwend Nederland')));
  assert.ok(entries.some(([k,v])=>k.includes('Powerhouse') && v.includes('Powerhouse') && v.includes('explicit approval')));
  assert.ok(entries.some(([k,v])=>k.includes('https://www.bouwendnederland.nl/kennis/digitalisering') && v.includes('https://www.bouwendnederland.nl/kennis/digitalisering')));
  assert.ok(entries.some(([k,v])=>k.includes('15-10-2026') && v.includes('15-10-2026')));
});
test('no machine-translation override or bypass is included in the cache patch',()=>{
  const names=Object.keys(patch);
  assert.ok(names.every(key=>!key.startsWith('STATIC_I18N_')));
  const builder=readFileSync(new URL('../tools/site-shell/build-localized-routes.mjs',import.meta.url),'utf8');
  assert.match(builder,/STATIC_I18N_PREPARE_INCOMPLETE/);
  assert.match(builder,/STATIC_I18N_CACHE_INCOMPLETE/);
});
