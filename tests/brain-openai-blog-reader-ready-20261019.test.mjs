import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const snippet=source.match(/function blogReaderReadyViolations\(artifact:any\):string\[\]\{([\s\S]*?)\n\}\n\nconst PERSONAL_STEERING_STORY/);
assert.ok(snippet,'the actual generator must expose a deterministic reader-ready verdict');
const executable='function blogReaderReadyViolations(artifact){'+snippet[1].replace('const errors:string[]=[];','const errors=[];')+'\n}\nblogReaderReadyViolations;';
const validate=vm.runInNewContext(executable,{});

test('blog reader-ready rule accepts a complete public article',()=>{
  const body=['## Context',...Array(9).fill('Signalen moeten tot besluiten en controleerbare acties leiden.'),'## Aanpak',...Array(9).fill('Verbind feiten met processen, een eigenaar en een meetpunt.'),'## Controle',...Array(9).fill('Controleer of de actie uitgevoerd is en het doel is bereikt.')].join('\n');
  assert.ok(body.length>1600);
  assert.deepEqual(Array.from(validate({title:'Externe signalen: van informatie naar actie',body,cta:'Bekijk de Frisse Blik'})),[]);
});

test('blog gate blocks editor-only instructions and does not fake signoff',()=>{
  const body=['## Context',...Array(10).fill('Signaleren is het begin; besluit en resultaat moeten herleidbaar zijn.'),'## Aanpak',...Array(10).fill('Een controleerbare actie heeft een bron, datum en eigenaar.'),'## Controle',...Array(10).fill('Een conclusie is geen bewezen resultaat zonder meting.')].join('\n');
  const base={title:'Externe signalen voor ondernemers',body,cta:'Start met de Frisse Blik'};
  assert.ok(validate({...base,body:'Voordat u publiceert: voer een URL-check uit.\n'+body}).includes('EDITORIAL_PUBLICATION_INSTRUCTIONS'));
  assert.ok(validate({...base,body:body+'\nPublicatiestap (vereist vóór live)\n1) publiceer'}).includes('EDITORIAL_PUBLICATION_INSTRUCTIONS'));
  assert.ok(validate({...base,title:'SEO-aanpak (canonieke pagina)'}).includes('DRAFT_TITLE'));
  assert.ok(validate({...base,cta:'Voer eerst een canonieke URL-eigenaarschap-check uit'}).includes('EDITORIAL_CTA'));
  assert.ok(validate({...base,body:'korte tekst'}).includes('BODY_TOO_SHORT'));
});

test('OpenAI blog reader-ready gating precedes canonical artifact writes',()=>{
  assert.match(source,/pending\.channel==='blog' \? BLOG_READER_READY_PROMPT/);
  assert.match(source,/blogReaderReadyViolations\(\{\.\.\.artifact,body:bodyText\}\)/);
  assert.match(source,/BLOG_READER_READY_CONTRACT_FAILED/);
  assert.match(source,/editorial_rejection_codes:violations/);
  const gate=source.indexOf("if(pending.channel==='blog'){");
  const write=source.indexOf("stage = 'write-artifact';");
  assert.ok(gate>0 && write>gate);
  assert.match(source,/automated_blog_reader_ready:/);
  assert.match(source,/final_copy_approved:pending\.channel==='linkedin_company'\|\|pending\.channel==='linkedin_personal'/);
});
