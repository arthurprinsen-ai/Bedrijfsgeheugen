import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePageContent } from '../native-pages.js';
import { findPage } from '../page-registry.js';

test('relevance is one existing authenticated tenant learning page', () => {
  assert.equal(findPage('learning-writeback').label, 'Relevantie & verbeteringen');
  const state={portal:{runtime:{learning:{updatedAt:'2026-10-22T12:00:00Z',items:[
    {naam:'Herstel met regressietest',status:'ok',healthy:true},
    {naam:'Incident wacht op bewijs',status:'aandacht',healthy:false}
  ]}}}};
  const view=nativePageContent('learning-writeback',state);
  const metrics=view.blocks.find(block=>block.type==='metrics');
  assert.deepEqual(metrics.items.slice(0,3),[
    ['Leerrecords','2'],['Bewezen leerrecords','1'],['Nog te verifiëren','1']
  ]);
  const lessons=view.blocks.find(block=>block.title==='Lessen uit de eigen omgeving');
  assert.deepEqual(lessons.items,[
    ['Herstel met regressietest','Bewezen in Brain'],
    ['Incident wacht op bewijs','Nog te verifiëren in Brain']
  ]);
});

test('missing tenant evidence is not converted into a success claim', () => {
  const view=nativePageContent('learning-writeback',{portal:{runtime:{}}});
  assert.equal(view.derived,false);
  assert.ok(view.blocks.some(block=>block.type==='empty'&&block.copy.includes('geen verifieerbaar')));
  assert.deepEqual(view.blocks[0].items.slice(0,3),[
    ['Leerrecords','—'],['Bewezen leerrecords','—'],['Nog te verifiëren','—']
  ]);
});

test('a learning item with healthy=true but no confirmed source status is not green', () => {
  const view=nativePageContent('learning-writeback',{portal:{runtime:{learning:{items:[
    {naam:'Nog geen Brain-bevestiging',healthy:true,status:'aandacht'}
  ]}}}});
  assert.deepEqual(view.blocks[0].items[1],['Bewezen leerrecords','0']);
  assert.equal(view.blocks.find(x=>x.title==='Lessen uit de eigen omgeving').items[0][1],'Nog te verifiëren in Brain');
});
