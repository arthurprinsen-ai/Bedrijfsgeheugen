import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('feature/story drag remains fail-closed until native delivery board exists', async()=>{
  const { INTERACTION_PARITY_MANIFEST }=await import('../interaction-parity.js');
  const item=INTERACTION_PARITY_MANIFEST.find(entry=>entry.id==='feature-story-drag');
  assert.equal(item?.status,'proven');
  assert.ok(fs.existsSync('modules/delivery-board.js'));
  assert.ok(fs.existsSync('modules/delivery-workspace.js'));
});

test('delivery board moves features between backlog/sprints and stories between features', async()=>{
  const { moveFeature, moveStory }=await import('../modules/delivery-board.js');
  const state={
    epics:[{id:'e1',title:'Datahub'}],
    features:[{id:'f1',epic:'e1',title:'Bron aansluiten',sprint:null},{id:'f2',epic:'e1',title:'Model bouwen',sprint:2}],
    stories:[{id:'s1',feature:'f1',role:'Finance',wish:'Ik wil brondata zien',reason:'zodat ik kan sturen'}],
    sprints:4
  };
  const movedFeature=moveFeature(state,'f1',3);
  assert.equal(movedFeature.features[0].sprint,3);
  assert.equal(movedFeature.features[0].title,'Bron aansluiten');
  const movedStory=moveStory(movedFeature,'s1','f2');
  assert.equal(movedStory.stories[0].feature,'f2');
  assert.equal(movedStory.stories[0].role,'Finance');
});

test('delivery board supports desktop drag and mobile move controls',()=>{
  const source=fs.readFileSync('modules/delivery-board.js','utf8');
  assert.match(source,/draggable/);
  assert.match(source,/dragstart/);
  assert.match(source,/drop/);
  assert.match(source,/data-feature-move-left/);
  assert.match(source,/data-feature-move-right/);
  assert.match(source,/data-story-target/);
});

test('taken-werkstromen delegates to native delivery workspace',()=>{
  const source=fs.readFileSync('page-shell.js','utf8');
  assert.match(source,/taken-werkstromen/);
  assert.match(source,/mountDeliveryWorkspace/);
});