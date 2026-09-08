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
  const view=pagePresentation('roadmap');
  assert.equal(view.kind,'native-v2');
  assert.ok(Array.isArray(view.blocks));
  assert.ok(view.blocks.length>=3);
  assert.ok(view.blocks.some(block=>block.type==='metrics'));
  assert.ok(view.blocks.some(block=>block.type==='worklist'));
  assert.ok(view.blocks.some(block=>block.type==='actions'));
});

test('different portal pages expose different native content contracts',()=>{
  const roadmap=pagePresentation('roadmap');
  const people=pagePresentation('mensen');
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
