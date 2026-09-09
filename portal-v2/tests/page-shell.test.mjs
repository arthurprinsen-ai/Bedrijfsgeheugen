import test from 'node:test';
import assert from 'node:assert/strict';
import { pagePresentation, searchPortalPages } from '../page-shell.js';

test('Brain and Powerhouse pages render natively without inventing live evidence',()=>{
  const view=pagePresentation('self-heal');
  assert.equal(view.kind,'native-v2');
  assert.equal(view.sectionId,'brein-powerhouse');
  assert.match(view.evidenceLabel,/runtime-evidence/i);
});

test('mapped portal pages are native and expose page-specific V2 blocks',()=>{
  const empty=pagePresentation('roadmap',{});
  assert.equal(empty.kind,'native-v2');
  assert.ok(Array.isArray(empty.blocks));
  assert.ok(empty.blocks.length>=3);
  assert.ok(empty.blocks.some(block=>block.type==='metrics'));
  assert.ok(empty.blocks.some(block=>block.type==='actions'));
  // zonder klantdata geen werklijst maar een expliciete lege staat
  assert.ok(empty.blocks.some(block=>block.type==='empty'));
  assert.equal(empty.derived,false);

  const filled=pagePresentation('roadmap',{portal:{roadmap:{items:[{title:'Klantdata',start:1,duration:3,progress:40}]}}});
  assert.ok(filled.blocks.some(block=>block.type==='worklist'));
  assert.equal(filled.derived,true);
});

test('different portal pages expose different native content contracts',()=>{
  const roadmap=pagePresentation('roadmap',{});
  const people=pagePresentation('mensen',{});
  assert.notDeepEqual(roadmap.blocks,people.blocks);
  assert.notEqual(roadmap.primaryAction,people.primaryAction);
});

test('portal search finds content across groups',()=>{
  const hits=searchPortalPages('recovery');
  assert.ok(hits.some(page=>page.id==='recovery-obligations'));
  const canvases=searchPortalPages('canvassen');
  assert.ok(canvases.some(page=>page.id==='canvassen'));
});

test('unknown portal page has no presentation',()=>{
  assert.equal(pagePresentation('bestaat-niet'),null);
});
