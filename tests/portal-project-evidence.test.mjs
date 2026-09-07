import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePortalProject,applyProjectRuntime} from '../portal-next/portal-project-model.js';
import {renderProjectTrace} from '../portal-next/portal-project-trace.js';

const base=normalizePortalProject({quote:{inhoud:{onderdelen:[{id:'fase1',sprints:[{titel:'Meetplan'}]}]}}});
const sprintId=base.sprints[0].id;

test('completed zonder evidence promoveert gepland item niet',()=>{
  const project=applyProjectRuntime(base,{items:[{id:sprintId,status:'completed',evidence:[]}]});
  assert.equal(project.sprints[0].status,'planned');
});

test('verified vereist evidence en houdt expected observed verified outcomes apart',()=>{
  const project=applyProjectRuntime(base,{items:[{id:sprintId,status:'completed',evidence:['run-42'],outcome:{expected:'Sneller sturen',observed:'Doorlooptijd daalde',verified:true}}]});
  assert.equal(project.sprints[0].status,'verified');
  assert.deepEqual(project.sprints[0].outcome,{expected:'Sneller sturen',observed:'Doorlooptijd daalde',verified:true});
});

test('trace activeert alleen evidence-backed runtimefasen',()=>{
  const html=renderProjectTrace({flow:{source:{status:'verified'},datahub:{status:'verified',evidence:['hub-run']},brain:{status:'waiting'},powerhouse:[],module:null,action:null,outcome:null,learning:{status:'idle'}}});
  assert.match(html,/Offerte/);assert.match(html,/Datahub/);assert.match(html,/AI Brain/);assert.match(html,/Powerhouse/);assert.match(html,/Outcome/);assert.match(html,/Learning/);
  assert.equal((html.match(/is-active/g)||[]).length,2);
});
