import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const sourceTitle='Hoe bereid je je MKB-boekhouding voor op integratie met mobiele betaalapps (en wie doet wat)?';
const py=String.raw`
import importlib.util,json
p='tools/site-shell/publish_powerhouse_blog_artifact.py'
spec=importlib.util.spec_from_file_location('publisher',p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
source={'title':'Hoe bereid je je MKB-boekhouding voor op integratie met mobiele betaalapps (en wie doet wat)?',
        'focus_keyword':'bereid',
        'body':'Mobiele betaalapps koppelen aan je MKB-boekhouding vergt een gecontroleerde integratie en reconciliatie.'}
focus=m.seo_focus(source)
legacy={'title':'Hoe Nederlandse cyberoefeningen jouw bedrijfsbeslissingen moeten beïnvloeden: concreet stappenplan voor ondernemers',
        'focus_keyword':'Hoe Nederlandse', 'body':'Nederlandse cyberoefeningen helpen bij voorbereiding.'}
oldfocus=m.seo_focus(legacy)
alt={'title':'Hoe bereid je je administratie voor op koppeling met Apple Pay?',
     'focus_keyword':'bereid','body':'Een administratie koppelen aan Apple Pay vergt een veilige controle.'}
altfocus=m.seo_focus(alt)
print(json.dumps({'focus':focus,'title':m.seo_title(source['title'],focus),
'legacy_focus':oldfocus,'legacy_title':m.seo_title(legacy['title'],oldfocus),
'alt_focus':altfocus,'alt_title':m.seo_title(alt['title'],altfocus)},ensure_ascii=False))
`;
const run=spawnSync('python3',['-c',py],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
const x=JSON.parse(run.stdout);

test('approved 18-Nov blog picks actual subject, not prepare/verb boilerplate',()=>{
  assert.equal(x.focus,'MKB-boekhouding');
  assert.equal(x.title,'MKB-boekhouding koppelen aan mobiele betaalapps');
  assert.ok(x.title.length<=60);
  assert.doesNotMatch(x.title,/^bereid:/i);
  assert.doesNotMatch(x.title,/wat verandert er voor jou/i);
  assert.doesNotMatch(x.focus,/^(bereid|voorbereiden|maak|zorg)$/i);
});

test('subject-specific normalization applies to source-pattern rather than hardcoded brand',()=>{
  assert.equal(x.alt_focus,'administratie');
  assert.equal(x.alt_title,'Administratie koppelen aan Apple Pay');
});

test('22-Oct source retains focus and a complete source-grounded influence relation',()=>{
  assert.equal(x.legacy_focus,'Nederlandse cyberoefeningen');
  assert.equal(x.legacy_title,'Nederlandse cyberoefeningen: invloed op bedrijfsbeslissingen');
  assert.ok(x.legacy_title.length<=60);
  assert.doesNotMatch(x.legacy_title,/wat verandert er voor jou/i);
});
