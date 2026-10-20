import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const slug='kennisverlies-door-personeelstekort-zo-verbind-je-signalen-aan-concret';
const url='https://www.bedrijfsgeheugen.nl/blog/'+slug+'/';
const page='blog/'+slug+'/index.html';
const count=(content,needle)=>content.split(needle).length-1;

test('daily canonical article is present exactly once in blog listing and sitemap',()=>{
  const html=read('blog/index.html');
  const sitemap=read('sitemap.xml');
  assert.equal(count(html,'href="/blog/'+slug+'/”'.replace('”','"')),1);
  assert.equal(count(sitemap,'<loc>'+url+'</loc>'),1);
  assert.ok(sitemap.includes('<lastmod>2026-10-20</lastmod>'));
});

test('RSS entry exists exactly once and preserves the canonical origin',()=>{
  const rss=read('blog/rss.xml');
  assert.equal(count(rss,'<item><title>Kennisverlies door: wat verandert er voor jou?</title>'),1);
  assert.equal(count(rss,'<guid>'+url+'</guid>'),1);
  assert.ok(rss.includes('<link>'+url+'</link>'));
  assert.ok(rss.includes('<pubDate>Tue, 20 Oct 2026'));
});

test('existing source article remains useful, specific and bilingual without creating another post',()=>{
  const html=read(page);
  const translations=JSON.parse(read('config/bg-static-i18n-en.d/powerhouse-blog-2026-10-20.json'));
  assert.match(html,/<title>[^<]+<\/title>/);
  assert.match(html,/Kennisverlies door/);
  assert.match(html,/CBS/);
  assert.match(html,/2026/);
  assert.ok(Object.keys(translations).length>15);
  assert.equal(count(read('blog/index.html'),'/blog/'+slug+'/'),1);
});
