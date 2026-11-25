import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePageContent } from '../native-pages.js';
import { findPage } from '../page-registry.js';
import { mapRuntimeProjection } from '../runtime-evidence.js';

test('relevance is one existing authenticated tenant learning page', () => {
  assert.equal(findPage('learning-writeback').label, 'Relevantie & verbeteringen');
  const state={portal:{runtime:{learning:{updatedAt:'2026-10-22T12:00:00Z',items:[
    {naam:'Herstel met regressietest',status:'ok',healthy:true,maturity:'PROVEN',productionVerified:true,proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'},
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


test('green transport without immutable evidence is NOT a proven fix',()=>{
  const view=nativePageContent('learning-writeback',{portal:{runtime:{learning:{items:[
    {naam:'Transport OK maar geen productieproof',status:'ok',healthy:true},
    {naam:'Claim zonder readback',status:'ok',healthy:true,maturity:'PROVEN'},
    {naam:'Claim met willekeurige bron',status:'ok',healthy:true,maturity:'PROVEN',productionVerified:true,proofRef:'https://example.org/fake'},
    {naam:'Bewezen bron maar ontbrekende provider-ACK',status:'ok',healthy:true,maturity:'PROVEN',proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/123'}
  ]}}}});
  assert.deepEqual(view.blocks[0].items.slice(0,3),[
    ['Leerrecords','4'],['Bewezen leerrecords','0'],['Nog te verifiëren','4']
  ]);
  assert.ok(view.blocks.find(x=>x.title==='Lessen uit de eigen omgeving').items.every(x=>x[1]==='Nog te verifiëren in Brain'));
});

test('the authenticated canonical memory projection preserves proof fields without inventing them',()=>{
  const runtime=mapRuntimeProjection({livingMemory:{memories:[
    {claim:'Echte gereviewde fix',status:'PROVEN',productionVerified:true,evidence:{runUrl:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'}},
    {claim:'Alleen groen statusveld',status:'PROVEN'},
    {claim:'Nog een incident',status:'OBSERVED',productionVerified:true,evidence:{run_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147'}}
  ]}});
  assert.deepEqual(runtime.learning.items.map(x=>[x.maturity,x.productionVerified,Boolean(x.proofRef)]),[
    ['PROVEN',true,true],['PROVEN',false,false],['OBSERVED',true,true]
  ]);
  const view=nativePageContent('learning-writeback',{portal:{runtime}});
  assert.deepEqual(view.blocks[0].items.slice(0,3),[
    ['Leerrecords','3'],['Bewezen leerrecords','1'],['Nog te verifiëren','2']
  ]);
});
