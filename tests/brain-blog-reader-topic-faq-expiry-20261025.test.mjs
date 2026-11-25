import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const script = String.raw`
import importlib.util,json
p='tools/site-shell/publish_powerhouse_blog_artifact.py'
s=importlib.util.spec_from_file_location('publisher',p)
m=importlib.util.module_from_spec(s); s.loader.exec_module(m)
raw={'title':'Publiceren voor de Circular Plastics NL-kans: beslis alleen als kanaalgates en commerciële waarde beide akkoord zijn',
 'focus_keyword':'Publiceren voor',
 'body':'De subsidieaanvragen waarschijnlijk op 6 oktober 2026 opengaan.'}
long_context=('De ondernemer moet bronnen toetsen, kansen inschatten en een eigenaar toewijzen. '*9)
bad={**raw,'body': 'De forecast meldt dat de subsidieaanvragen waarschijnlijk op 6 oktober 2026 opengaan. '+long_context}
good={**raw,'body': 'De forecast meldt dat de subsidieaanvragen waarschijnlijk op 6 november 2026 opengaan. '+long_context}
def verdict(payload):
 try: m.assert_reader_ready(payload,'2026-10-25'); return 'PASS'
 except SystemExit as e: return str(e)
faq={'body':'## Signaal: wat meldt de forecast?\nHier is een concrete onderbouwde verklaring.\n\n## Context en aanpak\nEen checklist met acties en afspraken.'}
print(json.dumps({'focus':m.seo_focus(raw),'title':m.seo_title(raw['title'],m.seo_focus(raw)),
 'expired':verdict(bad),'valid':verdict(good),'faq':m.faq_items(faq),
 'made_up_faq':m.faq_items({'body':'## Context en aanpak\nEen checklist met acties en afspraken.'}),
 'empty_faq_html':m.faq_html({'body':'## Context en aanpak\nEen checklist met acties en afspraken.'})},ensure_ascii=False))
`;
const proc=spawnSync('python3',['-c',script],{encoding:'utf8'});
assert.equal(proc.status,0,proc.stderr||proc.stdout);
const result=JSON.parse(proc.stdout);

test('meaningful subject replaces hanging SEO focus keyword',()=>{
  assert.equal(result.focus,'Circular Plastics');
  assert.match(result.title,/Circular Plastics/);
  assert.doesNotMatch(result.title,/^Publiceren voor:/);
});
test('past forecast openings are blocked, future dates are not',()=>{
  assert.equal(result.expired,'BLOG_ARTIFACT_NOT_READER_READY:EXPIRED_FUTURE_EVENT_CLAIM');
  assert.equal(result.valid,'PASS');
});
test('FAQ question is strictly the first heading line and keeps its answer',()=>{
  assert.equal(result.faq.length,1);
  assert.equal(result.faq[0][0],'Signaal: wat meldt de forecast?');
  assert.match(result.faq[0][1],/concrete onderbouwde verklaring/);
});
test('section titles are never fabricated into FAQs',()=>{
  assert.deepEqual(result.made_up_faq,[]);
  assert.equal(result.empty_faq_html,'');
  const publisher=readFileSync('tools/site-shell/publish_powerhouse_blog_artifact.py','utf8');
  assert.match(publisher,/if node\.get\("@type"\) != "FAQPage" or node\.get\("mainEntity"\)/);
});
