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

test('interaction parity manifest makes every known legacy gesture explicit and fail-closed', async () => {
  const module = await import('../interaction-parity.js');
  const ids = new Set(module.INTERACTION_PARITY_MANIFEST.map(item => item.id));
  for (const id of requiredInteractions) assert.ok(ids.has(id), `missing legacy interaction ${id}`);
  const proven = new Set(module.INTERACTION_PARITY_MANIFEST.filter(item=>item.status==='proven').map(item=>item.id));
  assert.ok(proven.has('roadmap-card-reorder'));
  assert.ok(proven.has('roadmap-card-sprint-move'));
  const open = new Set(module.openInteractionObligations().map(item=>item.id));
  for (const id of ['feature-story-drag','strategy-card-reorder','overview-block-reorder']) assert.ok(open.has(id), `${id} must remain open until implemented`);
});

test('roadmap has a native interactive board, not only editable rows', () => {
  assert.ok(fs.existsSync('modules/roadmap-board.js'));
  const source = fs.readFileSync('modules/roadmap-board.js','utf8');
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

test('workspace shell delegates roadmap to its specialist interactive workspace', () => {
  assert.ok(fs.existsSync('modules/roadmap-workspace.js'));
  const shell=fs.readFileSync('workspace-shell.js','utf8');
  const workspace=fs.readFileSync('modules/roadmap-workspace.js','utf8');
  assert.match(shell,/roadmap-workspace\.js/);
  assert.match(workspace,/mountRoadmapBoard/);
  assert.match(workspace,/data-functional-workspace/);
});