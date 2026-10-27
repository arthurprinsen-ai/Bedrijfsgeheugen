import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('novice AI Modelwijzer public copy is covered by deterministic English cache',()=>{
  const cache=JSON.parse(readFileSync('config/bg-static-i18n-en.d/2026-09-30-ai-modelwijzer-v2.json','utf8'));
  const required=[
    'Je hoeft geen modelnamen, tokens of technische termen te kennen.',
    'Waar wil je AI vooral voor gebruiken?',
    'Processen automatiseren',
    'Persoonsgegevens / klantdata',
    'Moet aantoonbaar in Europa',
    'Geef mij een begrijpelijk advies →',
    'De wijzer maakt eerst een praktische shortlist. Daarna kun je de technische details, brondata en governance per model bekijken. Kosten blijven indicatief: werkelijk gebruik, retries, tooling en contractprijzen kunnen afwijken.'
  ];
  for(const key of required){
    assert.equal(typeof cache[key],'string',key+' missing from static English cache');
    assert.ok(cache[key].trim().length>0,key+' has empty English translation');
  }
  const skill=readFileSync('.agents/skills/powerhouse-ai-model-intelligence/SKILL.md','utf8');
  assert.match(skill,/ai-modelwijzer-novice-static-i18n-v1/);
  assert.match(skill,/STATIC_I18N_REQUIRE_CACHE=1/);
});
