import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const base='blog/hoe-nederlandse-cyberoefeningen-jouw-bedrijfsbeslissingen-moeten-beinv/';
const path=base+'index.html';
const canonical='https://www.bedrijfsgeheugen.nl/'+base;
const article=readFileSync(path,'utf8');
const listing=readFileSync('blog/index.html','utf8');
const rss=readFileSync('blog/rss.xml','utf8');
const sitemap=readFileSync('sitemap.xml','utf8');
const i18n=JSON.parse(readFileSync('config/bg-static-i18n-en.d/powerhouse-blog-2026-10-22.json','utf8'));
test('same-day daily blog has exactly one candidate URL in index/RSS/sitemap',()=>{
 assert.match(article,new RegExp('<link rel="canonical" href="'+canonical+'">'));
 assert.equal((listing.split('href="/'+base+'"').length-1),1);
 assert.equal((rss.split('<guid>'+canonical+'</guid>').length-1),1);
 assert.equal((sitemap.split('<loc>'+canonical+'</loc>').length-1),1);
});
test('SEO title is readable and English cache has translated keys',()=>{
 assert.match(article,/<h1>Nederlandse cyberoefeningen: wat verandert er voor jou\?<\/h1>/);
 for(const s of [article,listing,rss,...Object.keys(i18n)])assert.doesNotMatch(s,/Hoe Nederlandse/);
 assert.ok(Object.keys(i18n).some(k=>k.startsWith('Nederlandse cyberoefeningen:')));
 assert.ok(Object.values(i18n).some(v=>String(v).startsWith('Dutch cyber exercises:')));
});
test('source generator never chooses "Hoe Nederlandse" as keyword',()=>{
 const py=`import importlib.util,json
p='tools/site-shell/publish_powerhouse_blog_artifact.py'
spec=importlib.util.spec_from_file_location('publisher',p); mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
data={'title':'Hoe Nederlandse cyberoefeningen jouw bedrijfsbeslissingen moeten beïnvloeden: concreet stappenplan voor ondernemers','focus_keyword':'Hoe Nederlandse','body':'Nederlandse cyberoefeningen helpen bij voorbereiding.'}
f=mod.seo_focus(data)
print(json.dumps({'focus':f,'title':mod.seo_title(data['title'],f)},ensure_ascii=False))
`;
 const call=spawnSync('python3',['-c',py],{encoding:'utf8'});
 assert.equal(call.status,0,call.stderr);
 const out=JSON.parse(call.stdout);
 assert.equal(out.focus,'Nederlandse cyberoefeningen');
 assert.equal(out.title,'Nederlandse cyberoefeningen: wat verandert er voor jou?');
});
