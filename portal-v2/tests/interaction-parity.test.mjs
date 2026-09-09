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
  for (const id of ['roadmap-card-reorder','roadmap-card-sprint-move','feature-story-drag']) assert.ok(proven.has(id), `${id} must be proven`);
  const open = new Set(module.openInteractionObligations().map(item=>item.id));
  for (const id of ['strategy-card-reorder','overview-block-reorder']) assert.ok(open.has(id), `${id} must remain open until implemented`);
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

test('native delivery board preserves feature and story relations while moving them', async () => {
  assert.ok(fs.existsSync('modules/delivery-board.js'));
  const source=fs.readFileSync('modules/delivery-board.js','utf8');
  for (const contract of [/draggable/,/dragstart/,/drop/,/data-feature/,/data-story/,/data-sprint/,/data-move-feature/,/data-move-story/]) assert.match(source,contract);
  const { moveFeatureToSprint, moveStoryToFeature } = await import('../modules/delivery-board.js');
  const state={
    features:[
      {id:'f1',title:'Bronnen koppelen',sprint:'backlog',epic:'e1',value:4000},
      {id:'f2',title:'Dashboard',sprint:2,epic:'e2',value:3000}
    ],
    stories:[
      {id:'s1',feature:'f1',role:'manager',wish:'status zien',reason:'ik kan sturen'},
      {id:'s2',feature:'f2',role:'medewerker',wish:'minder overtypen',reason:'ik tijd bespaar'}
    ]
  };
  const movedFeature=moveFeatureToSprint(state,'f1',3);
  assert.equal(movedFeature.features.find(f=>f.id==='f1').sprint,3);
  assert.equal(movedFeature.features.find(f=>f.id==='f1').epic,'e1');
  assert.equal(movedFeature.stories.find(s=>s.id==='s1').feature,'f1');
  const movedStory=moveStoryToFeature(movedFeature,'s1','f2');
  assert.equal(movedStory.stories.find(s=>s.id==='s1').feature,'f2');
  assert.equal(movedStory.stories.find(s=>s.id==='s1').role,'manager');
  assert.equal(movedStory.features.find(f=>f.id==='f2').value,3000);
  const invalidMove=moveStoryToFeature(movedStory,'s1','missing-feature');
  assert.equal(invalidMove.stories.find(s=>s.id==='s1').feature,'f2','invalid targets must not orphan stories');
});

test('roadmap workspace mounts the native delivery board in the same canonical state', () => {
  const workspace=fs.readFileSync('modules/roadmap-workspace.js','utf8');
  assert.match(workspace,/mountDeliveryBoard/);
  assert.match(workspace,/portal\.roadmap\.delivery/);
});
