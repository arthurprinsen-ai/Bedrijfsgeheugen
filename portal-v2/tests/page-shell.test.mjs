import test from 'node:test';
import assert from 'node:assert/strict';
import { pagePresentation, searchPortalPages } from '../page-shell.js';

test('Brain and Powerhouse pages render natively without inventing live evidence',()=>{
  const view=pagePresentation('self-heal');
  assert.equal(view.kind,'native-v2');
  assert.equal(view.sectionId,'brein-powerhouse');
  assert.match(view.evidenceLabel,/runtime-evidence/i);
});

test('mapped existing portal pages retain the legacy bridge',()=>{
  const view=pagePresentation('roadmap');
  assert.equal(view.kind,'legacy');
  assert.equal(view.legacyTab,'roadmap');
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
