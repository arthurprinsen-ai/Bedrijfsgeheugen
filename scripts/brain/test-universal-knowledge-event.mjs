import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeKnowledgeEvent,validateKnowledgeEvent} from '../../brain/knowledge/knowledge-event.mjs';

test('normalizes a source-linked material knowledge event',()=>{
  const event=normalizeKnowledgeEvent({
    source_type:'github',
    source_refs:[{system:'github',kind:'pull_request',id:'1159',relationship:'origin'}],
    actor:{type:'human',id:'arthurprinsen-ai',name:'Arthur Prinsen'},
    component:'website:homepage-hero-video',
    architecture_layer:'frontend',
    intent:'restore homepage hero video playback',
    decision:{decision:'add lifecycle recovery',rationale:'static autoplay attributes were insufficient',owner:'Powerhouse'},
    action:{summary:'add initHeroVideoRecovery',technical_changes:['assets/js/menu.js']},
    evidence:[{kind:'commit',id:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5'}],
    outcome:{status:'success',summary:'production deploy ready'},
    rollback:{strategy:'revert merge SHA',last_known_good_ref:'121d5a6c715a5fba2655f743a502b64cb0a26ac8'}
  },{now:()=> '2026-09-08T10:37:11.053Z',idFactory:()=> 'uke-1159'});
  assert.equal(event.schema_version,'powerhouse.knowledge-event.v1');
  assert.equal(event.event_id,'uke-1159');
  assert.equal(event.producer,'human:arthurprinsen-ai');
  assert.equal(validateKnowledgeEvent(event).valid,true);
});

test('rejects secrets and missing source refs',()=>{
  const invalid={schema_version:'powerhouse.knowledge-event.v1',event_id:'x',source_refs:[],context_summary:'token=secret'};
  const result=validateKnowledgeEvent(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(x=>x.includes('source_refs')));
});
