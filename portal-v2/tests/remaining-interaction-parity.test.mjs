import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const strategySource=()=>fs.readFileSync('modules/strategy-board.js','utf8');
const overviewSource=()=>fs.readFileSync('modules/overview-reorder.js','utf8');

test('strategy cards can be reordered without losing card data',async()=>{
  const {reorderStrategyCards}=await import('../modules/strategy-board.js');
  const cards=[
    {id:'ambitie',label:'Ambitie',value:'Groei',owner:'MT'},
    {id:'klant',label:'Klantbelofte',value:'Snel',owner:'Sales'},
    {id:'keuzes',label:'Keuzes',value:'Focus',owner:'CEO'}
  ];
  const next=reorderStrategyCards(cards,'keuzes','ambitie');
  assert.deepEqual(next.map(card=>card.id),['keuzes','ambitie','klant']);
  assert.equal(next[0].value,'Focus');
  assert.equal(next[0].owner,'CEO');
});

test('strategy reorder is native desktop drag drop with mobile controls and canonical persistence',()=>{
  const source=strategySource();
  assert.match(source,/draggable="true"/);
  assert.match(source,/dragstart/);
  assert.match(source,/drop/);
  assert.match(source,/data-strategy-move-up/);
  assert.match(source,/data-strategy-move-down/);
  assert.match(source,/portal\.strategy\.cardOrder/);
  assert.match(source,/domainState\.set/);
  assert.match(source,/domainState\.flush/);
});

test('overview blocks can be reordered without losing block identity',async()=>{
  const {reorderOverviewBlocks}=await import('../modules/overview-reorder.js');
  const blocks=['brain','summary','roadmap','opportunities','impact','activities'];
  assert.deepEqual(reorderOverviewBlocks(blocks,'impact','summary'),['brain','impact','summary','roadmap','opportunities','activities']);
});

test('overview reorder is native desktop drag drop with mobile controls and canonical persistence',()=>{
  const source=overviewSource();
  assert.match(source,/draggable/);
  assert.match(source,/dragstart/);
  assert.match(source,/drop/);
  assert.match(source,/data-overview-move-up/);
  assert.match(source,/data-overview-move-down/);
  assert.match(source,/portal\.overview\.blockOrder/);
  assert.match(source,/domainState\.set/);
  assert.match(source,/domainState\.flush/);
});

test('remaining interaction parity obligations are proven only after native implementations exist',async()=>{
  const {INTERACTION_PARITY_MANIFEST,openInteractionObligations}=await import('../interaction-parity.js');
  const proven=new Set(INTERACTION_PARITY_MANIFEST.filter(item=>item.status==='proven').map(item=>item.id));
  assert.ok(proven.has('strategy-card-reorder'));
  assert.ok(proven.has('overview-block-reorder'));
  assert.equal(openInteractionObligations().length,0);
});

test('mobile parity controls have at least a 44px touch target',()=>{
  const css=fs.readFileSync('interaction.css','utf8');
  assert.match(css,/\.v2strategycontrols[\s\S]*min-(?:width|height):44px/);
  assert.match(css,/\.v2overviewcontrols[\s\S]*min-(?:width|height):44px/);
});
