import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

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
