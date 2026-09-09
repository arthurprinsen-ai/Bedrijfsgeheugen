import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const requiredInteractions = [
  'roadmap-card-reorder',
  'roadmap-card-sprint-move',
  'feature-story-drag',
  'strategy-card-reorder',
  'overview-block-reorder'
];

test('interaction parity manifest makes legacy gestures explicit and fail-closed', async () => {
  const module = await import('../interaction-parity.js');
  const ids = new Set(module.INTERACTION_PARITY_MANIFEST.map(item => item.id));
  for (const id of requiredInteractions) assert.ok(ids.has(id), `missing legacy interaction ${id}`);
  assert.equal(module.openInteractionObligations().length, 0);
});

test('roadmap has a native interactive board, not only editable rows', () => {
  assert.ok(fs.existsSync('portal-v2/modules/roadmap-board.js'));
  const source = fs.readFileSync('portal-v2/modules/roadmap-board.js','utf8');
  assert.match(source, /draggable/);
  assert.match(source, /dragstart/);
  assert.match(source, /drop/);
  assert.match(source, /data-sprint/);
  assert.match(source, /moveRoadmapItem/);
  assert.match(source, /reorderRoadmapItems/);
  assert.match(source, /data-move-left/);
  assert.match(source, /data-move-right/);
});

test('roadmap move and reorder preserve all card data', async () => {
  const { moveRoadmapItem, reorderRoadmapItems } = await import('../modules/roadmap-board.js');
  const source = [
    { id:'a', title:'Analyse', sprint:1, owner:'Arthur', progress:20 },
    { id:'b', title:'Bouwen', sprint:2, owner:'Team', progress:40 },
    { id:'c', title:'Test', sprint:2, owner:'QA', progress:60 }
  ];
  const moved = moveRoadmapItem(source,'a',3);
  assert.equal(moved[0].sprint,3);
  assert.equal(moved[0].owner,'Arthur');
  const reordered = reorderRoadmapItems(moved,'c','b');
  assert.deepEqual(reordered.map(item=>item.id),['a','c','b']);
  assert.equal(reordered[1].owner,'QA');
});
