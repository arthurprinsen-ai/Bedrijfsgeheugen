import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=(name)=>readFileSync('supabase/functions/'+name+'/index.ts','utf8');
const sourceFn=(name)=>{
 const line=read(name).split('\n').find(line=>line.trim().startsWith('const slugify='));
 assert.ok(line,'missing '+name+' canonical slugifier');
 return vm.runInNewContext(line+'\nslugify;');
};
test('queue matches already-merged #4723 export identity at the 2026-10-23 boundary',()=>{
 const title='Cyberdreigingen voor ondernemers: een praktisch beslis- en oefenplan om risico’s bestuurlijk te beheersen';
 const queue=sourceFn('powerhouse-blog-queue');
 const exporter=sourceFn('powerhouse-blog-export');
 assert.equal(queue(title),'cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om');
 assert.equal(exporter(title),'cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om');
 assert.equal(queue(title),exporter(title));
 assert.match(queue(title),/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});
test('all approved title fallback boundaries remain well-formed and parity is durable',()=>{
 const queue=sourceFn('powerhouse-blog-queue'),exporter=sourceFn('powerhouse-blog-export');
 for(const title of ['A'.repeat(69)+'-more', 'Énergie & Kosten!', 'red '.repeat(50), 'a'.repeat(70), 'foo--bar', 'cyber']) {
  assert.equal(queue(title),exporter(title),title);
  assert.match(queue(title),/^[a-z0-9]+(?:-[a-z0-9]+)*$/,title);
  assert.ok(queue(title).length<=70);
 }
 assert.equal(queue('A'.repeat(69)+'-more'),'a'.repeat(69));
});
test('both source functions preserve approved explicit seo_slug without rewriting and bind identity to corrected title fallback',()=>{
 for(const name of ['powerhouse-blog-queue','powerhouse-blog-export']){
  const src=read(name);
  assert.match(src,/clean\((?:generationEvidence|generation)\.seo_slug\)\|\|slugify\(clean\(a\.title\)\)/);
  assert.match(src,/slice\(0,70\)\.replace\(\/-\+\$\/g,''\)/);
 }
});
test('prior GENERATED-only queue CAS remains unweakened',()=>{
 const src=read('powerhouse-blog-queue');
 assert.match(src,/canRebindUnsentBlog\(o,provenance\)/);
 assert.match(src,/originalBlogSlugGuard\(recoveryQuery,o\.slug\)/);
 assert.match(src,/\.eq\('status','GENERATED'\)/);
 assert.match(src,/\.is\('external_id',null\)\.is\('published_at',null\)\.is\('live_proven_at',null\)/);
 assert.doesNotMatch(src,/p_status:'LIVE_PROVEN'/);
});
