import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const exporter=readFileSync('supabase/functions/powerhouse-blog-export/index.ts','utf8');
const publisher=readFileSync('tools/site-shell/publish_powerhouse_blog_artifact.py','utf8');
const sourceLine=exporter.match(/^const slugify=\(s:string\)=>([^\n;]+);$/m);
assert.ok(sourceLine,'exact production slugify source must remain executable and auditable');
const slugify=vm.runInNewContext(`(s)=>${sourceLine[1]}`,Object.create(null));
const validSlug=s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

test('actual 23 October approved artifact slug is canonical and no longer ends at a hyphen boundary',()=>{
 const title='Cyberdreigingen voor ondernemers: een praktisch beslis- en oefenplan om risico’s bestuurlijk te beheersen';
 const slug=slugify(title);
 assert.equal(slug,'cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om');
 assert.ok(validSlug(slug)); assert.ok(slug.length<=70);
});
test('long titles, diacritics and punctuation always produce bounded safe path components',()=>{
 for(const title of [
  'Beveiliging, beheer, financiën: het zorgvuldig doorlopen van tientallen beslissingen zonder gevaarlijke URL-tekens',
  'abc '.repeat(45),
  'Bedrijf / updates: wie beslist er werkelijk over de volgende stap in dit heel lange onderwerp?',
 ]){const slug=slugify(title);assert.ok(validSlug(slug),slug);assert.ok(slug.length<=70,slug);assert.ok(!slug.endsWith('-'));}
});
test('empty and hostile input cannot become a traversable slug; exporter retains original fail-closed readiness',()=>{
 assert.equal(slugify(' --- // '),'');
 assert.ok(validSlug(slugify('../Eerste / artikel\u0301')));
 assert.match(exporter,/\|\|\('powerhouse-'\+runDate\)/);
 assert.match(exporter,/BLOG_LINEAGE_MISMATCH_REQUIRES_RECONCILIATION/);
 assert.match(exporter,/clean\(o\?\.status\)!=='GENERATED'/);
 assert.match(publisher,/INVALID_SLUG/);
 assert.match(publisher,/\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*/);
});
test('blog URL, content ID, and slug are all derived from the same checked source',()=>{
 assert.match(exporter,/const contentId='blog:'\+slug/);
 assert.match(exporter,/const canonical='https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/'\+slug\+'\/'/);
 assert.match(exporter,/clean\(generation\.seo_slug\)\|\|slugify\(clean\(a\.title\)\)/);
});
