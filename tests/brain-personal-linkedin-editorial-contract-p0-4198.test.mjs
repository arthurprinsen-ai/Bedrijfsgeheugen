import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {personalEditorialViolations,PERSONAL_EDITORIAL_POLICY} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';

const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');
const reviewer=read('supabase/functions/bg-pre-publish-review/index.ts');
const codes=(text,evidence={ai_native_builder_story_verified:true})=>personalEditorialViolations(text,evidence).map(v=>v.code);

const valid = [
'Vandaag merkte ik bij het bouwen van Bedrijfsgeheugen opnieuw waarom ik hier ooit aan begon.',
'We kunnen inmiddels steeds meer informatie verzamelen. Maar wat heeft een ondernemer eraan wanneer belangrijke signalen pas zichtbaar worden nadat een beslissing al is genomen?',
'Ik geloof dat strategie daarom geen plan kan zijn dat je jaarlijks afstoft. Technologie, klantvragen, regelgeving en de wereld veranderen voortdurend. Je hoeft niet elke dag de koers om te gooien, maar je moet wel dagelijks kunnen beoordelen of iets wezenlijks verschuift.',
'Met Bedrijfsgeheugen probeer ik daar een antwoord op te bouwen. Niet door ondernemers nog meer grafieken voor te zetten, maar door veranderingen te verbinden met de keuzes waar zij voor staan.',
'Dat klinkt vanzelfsprekend. In de praktijk is het moeilijker om van een signaal naar een verantwoord besluit en vervolgens naar een meetbaar resultaat te komen.',
'Ik wil dat de software dat proces beter ondersteunt en dat een ondernemer zelf de regie houdt.',
'Welke verandering in jouw bedrijf zou je het liefst eerder zien aankomen?'
].join('\n\n');

test('Notion personal voice accepts authentic plain-text founder chapter without product pitch',()=>{
  assert.deepEqual(codes(valid),[]);
  assert.equal(PERSONAL_EDITORIAL_POLICY,'personal-linkedin-founder-editorial-v3');
});

test('historical screenshot rejects raw Markdown, system status and invented statistic',()=>{
  const bad=valid.replace('Vandaag merkte ik','**Vandaag merkte ik**')
    .replace('Welke verandering','---\n\nZeven op de tien mkb-bedrijven keuren facturen handmatig goed.\n\nDe bewakingscycli staan groen. Blog stond live, e-mail werd verzonden.\n\nWelke verandering');
  const rejected=codes(bad);
  for(const reason of ['PERSONAL_EDITORIAL_MARKDOWN','PERSONAL_EDITORIAL_UNSOURCED_STATISTIC','PERSONAL_EDITORIAL_TECHNICAL_STATUS','PERSONAL_EDITORIAL_DELIVERY_REPORT'])assert.ok(rejected.includes(reason),reason);
});

test('verification of numeric claim must match exact phrase and explicit source',()=>{
  const bad=valid.replace('We kunnen inmiddels steeds meer informatie verzamelen.','Zeven op de tien bedrijven keuren facturen handmatig goed.');
  assert.ok(codes(bad).includes('PERSONAL_EDITORIAL_UNSOURCED_STATISTIC'));
  const accepted=codes(bad,{ai_native_builder_story_verified:true,verified_numeric_claims:[{claim:'Zeven op de tien',verified:true,source_url:'https://example.org/report',checked_at:'2026-10-10T10:00:00Z'}]});
  assert.ok(!accepted.includes('PERSONAL_EDITORIAL_UNSOURCED_STATISTIC'));
});

test('generic company marketing and direct calls to buy stay out of personal',()=>{
  assert.ok(codes(valid+'\n\nBoek nu een gratis scan.').includes('PERSONAL_EDITORIAL_PROMOTION'));
  assert.ok(codes(valid.replace('Welke verandering in jouw bedrijf zou je het liefst eerder zien aankomen?','Ontdek onze diensten.')).includes('PERSONAL_EDITORIAL_OPEN_QUESTION'));
  assert.ok(codes(valid.replace('Vandaag merkte ik','Vandaag ✨ merkte ik')).includes('PERSONAL_EDITORIAL_EMOJI'));
});

test('generation applies editorial v3 to BOTH Anthropic and Composio, before final SHA',()=>{
  assert.match(orchestrator,/artifact=await callAI\(apiKey,gov\.model_id,editorialSystem/);
  assert.match(orchestrator,/artifact=await callComposioArtifact\(db,generationModel,editorialSystem/);
  const editorial=orchestrator.indexOf('const editorialViolations=personalEditorialViolations(bodyText');
  const hash=orchestrator.indexOf('const finalTextHash = await digest(bodyText)');
  assert.ok(editorial>0 && editorial<hash);
  assert.match(orchestrator,/final_copy_approved:pending\.channel==='linkedin_company'\|\|pending\.channel==='linkedin_personal'/);
  assert.match(orchestrator,/editorial_policy_version:pending\.channel==='linkedin_personal'\?PERSONAL_EDITORIAL_POLICY/);
});

test('reviewer independently enforces approval and text formatting as mandatory publish gate',()=>{
  assert.match(reviewer,/PERSONAL_EDITORIAL_APPROVAL_MISSING/);
  assert.match(reviewer,/PERSONAL_EDITORIAL_POLICY_OUTDATED/);
  assert.match(reviewer,/out\.push\(\.\.\.personalEditorialViolations\(text,body\)\)/);
  assert.match(reviewer,/final_text_hash/);
});

test('publisher refuses invalid personal copy before day authority, reserve, or provider mutation',()=>{
  const gate=publisher.indexOf("if(row.channel==='linkedin_personal') {\n      const editorialEvidence");
  const capability=publisher.indexOf('capability=await issuePublishCapability(db,runDate,row.channel');
  const send=publisher.indexOf("if (row.channel === 'linkedin_personal') {",capability);
  assert.ok(gate>0&&gate<capability&&capability<send);
  assert.match(publisher,/status:'blocked_editorial'/);
  assert.match(publisher,/provider_create_success:false,possible_provider_side_effect:false/);
  assert.match(publisher,/final_copy_approved:art\.generation_evidence\?\.final_copy_approved===true/);
  assert.match(publisher,/editorial_policy_version:clean\(art\.generation_evidence\?\.editorial_policy_version\)/);
  assert.match(publisher,/reserveGlobalUniquePublication\(db,runDate,row.channel/);
});
