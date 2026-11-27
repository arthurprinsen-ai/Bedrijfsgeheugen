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
 assert.match(out.title,/Nederlandse cyberoefeningen/);
 assert.ok(out.title.length<=60,'source title must obey bounded SEO length');
 assert.doesNotMatch(out.title,/wat verandert er voor jou\?/i);
});

// 15 Nov original provider-source topic preservation regression.
const python=String.raw`
import importlib.util
spec=importlib.util.spec_from_file_location('publisher','tools/site-shell/publish_powerhouse_blog_artifact.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
from scripts.ci.blog_technical_seo_gate import validate_editorial_topic_keywords as editorial

original_title='Stap‑voor‑stap: MKB klaarmaken voor integratie tussen boekhouding en mobiele betaalapps'
source={
 'title':original_title,
 'body':'Een praktische integratie tussen boekhouding en mobiele betaalapps, met brongebonden tests, controls en resultaten.',
 'focus_keyword':'Stap'
}
keyword=mod.seo_focus(source)
assert keyword.casefold() == 'boekhouding en mobiele betaalapps',repr(keyword)
title=mod.seo_title(original_title,keyword)
assert 30 <= len(title) <= 60,repr(title)
assert 'boekhouding' in title.casefold() and 'mobiele betaalapps' in title.casefold(),repr(title)
assert 'wat verandert er voor jou?' not in title.casefold(),repr(title)
editorial(title,keyword)
assert mod.seo_focus({'title':'Hoe je Twinfield-koppeling voorbereidt voor mobiele betalingen: praktisch stappenplan','body':'Twinfield mobiele betalingen'}) == 'Twinfield'
assert mod.seo_focus({'title':'Voorbereiden op boekhoud koppelingen','body':'boekhoud koppelingen','focus_keyword':'boekhoud koppelingen'}) == 'boekhoud koppelingen'
editorial('Twinfield-koppeling met mobiele betalingen voor MKB','Twinfield')
for bad_title,bad_keyword in [
 ('Stap: wat verandert er voor jou?','Stap'),
 ('Plan: praktisch uitgelegd','boekhouding'),
 ('MKB Boekhouding: praktische aanpak voor ondernemers','plan')
]:
 try: editorial(bad_title,bad_keyword)
 except SystemExit: pass
 else: raise AssertionError((bad_title,bad_keyword))
assert 'wat verandert er voor jou?' not in mod.seo_title('Hoe je Twinfield-koppeling voorbereidt voor mobiele betalingen: praktisch stappenplan','Twinfield')
`;

test('original Supabase-first blog publisher preserves the real two-system search intent and safe first-party vendor scope',()=>{
 const result=spawnSync('python3',['-c',python],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr+'\\n'+result.stdout);
});

test('the existing technical SEO preflight invokes the editorial gate before counting weak keyword occurrences',()=>{
 const s=readFileSync('scripts/ci/blog_technical_seo_gate.py','utf8');
 const start=s.indexOf('    keyword = keyword_meta[0].strip()');
 const guard=s.indexOf('    validate_editorial_topic_keywords(title, keyword)',start);
 const tokenCheck=s.indexOf('    kw_tokens = significant_tokens(keyword)',start);
 assert.ok(start>0 && guard>start && tokenCheck>guard);
 assert.match(s,/SEO_EDITORIAL_TOPIC_MISSING_GENERIC_KEYWORD/);
 assert.match(s,/SEO_EDITORIAL_GENERIC_TITLE_TEMPLATE_FORBIDDEN/);
});

test('no second publisher, scheduler, media worker or provider is introduced',()=>{
 const s=readFileSync('tools/site-shell/publish_powerhouse_blog_artifact.py','utf8');
 const focus=s.slice(s.indexOf('def seo_focus('),s.indexOf('def seo_meta('));
 assert.doesNotMatch(focus,/urllib|requests|post_request|cron\.schedule|http_post|subprocess/);
 assert.match(focus,/def seo_title\(title, focus\):/);
 assert.doesNotMatch(focus,/suffixes\s*=\s*\["wat verandert er voor jou/);
});


test('24 November source topic remains concrete while the existing preparation path survives',()=>{
 const py=String.raw`import importlib.util
spec=importlib.util.spec_from_file_location('publisher','tools/site-shell/publish_powerhouse_blog_artifact.py')
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
data={'title':'Bankverschillen oplossen met Twinfield: praktische controle op betaalreferenties en openstaande facturen','focus_keyword':'Bankverschillen oplossen','body':'Bankverschillen oplossen met Twinfield en betaalreferenties.'}
f=mod.seo_focus(data); t=mod.seo_title(data['title'],f)
assert 'bankverschillen' in t.casefold() and 'twinfield' in t.casefold(),repr(t)
assert 30 <= len(t) <= 60 and 'wat verandert er voor jou?' not in t.casefold(),repr(t)
assert mod.seo_title('Hoe bereid je je MKB-boekhouding voor op integratie met Twinfield?','MKB-boekhouding') == 'MKB-boekhouding koppelen aan Twinfield'
`;
 const result=spawnSync('python3',['-c',py],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
});
