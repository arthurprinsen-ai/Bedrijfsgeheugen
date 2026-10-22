import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePageContent } from '../native-pages.js';
import { findPage } from '../page-registry.js';
import { mapRuntimeProjection } from '../runtime-evidence.js';

test('relevance is one existing authenticated tenant learning page', () => {
  assert.equal(findPage('learning-writeback').label, 'Relevantie & verbeteringen');
  const state={portal:{runtime:{learning:{tenantId:'tenant-a',updatedAt:'2026-10-22T12:00:00Z',items:[
    {naam:'Herstel met regressietest',status:'ok',healthy:true,maturity:'PROVEN',tenantId:'tenant-a',
     regressionRef:'tests/brain-portal-relevance-proof-authority-v1.test.mjs',
     provenFix:'Vastgelegde geteste reparatie',
     productionReadbackUrl:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'},
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

test('healthy and ok without immutable Brain proof remain unverified', () => {
  const view=nativePageContent('learning-writeback',{portal:{runtime:{learning:{
    tenantId:'tenant-a',items:[{naam:'Misleidend gezond',status:'ok',healthy:true}]
  }}}});
  assert.deepEqual(view.blocks[0].items[1],['Bewezen leerrecords','0']);
  assert.equal(view.blocks.find(b=>b.title==='Lessen uit de eigen omgeving').items[0][1],'Nog te verifiëren in Brain');
});

test('a PROVEN record for another tenant never counts as proven', () => {
  const view=nativePageContent('learning-writeback',{portal:{runtime:{learning:{
    tenantId:'tenant-a',items:[{naam:'Andere klant',status:'ok',healthy:true,maturity:'PROVEN',
      tenantId:'tenant-b',provenFix:'Verifieerbaar herstel',regressionRef:'tests/brain-proof.test.mjs',
      productionReadbackUrl:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'}]
  }}}});
  assert.deepEqual(view.blocks[0].items[1],['Bewezen leerrecords','0']);
});

test('the canonical tenant runtime adapter preserves actual proof and never invents one', () => {
  const good=mapRuntimeProjection({tenantId:'tenant-a',livingMemory:{memories:[{
    subjectId:'repaired-source',status:'PROVEN',tenant_id:'tenant-a',
    proven_fix:'Bronherstel',regression_ref:'tests/brain-proof.test.mjs',
    evidence:{production_readback_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'}
  }]}});
  assert.equal(good.learning.tenantId,'tenant-a');
  assert.equal(good.learning.items[0].healthy,true);
  assert.equal(nativePageContent('learning-writeback',{portal:{runtime:good}})
    .blocks[0].items[1][1],'1');

  const unknown=mapRuntimeProjection({tenantId:'tenant-a',livingMemory:{memories:[
    {subjectId:'transport-only',status:'PROVEN',tenant_id:'tenant-a'},
    {subjectId:'other-tenant',status:'PROVEN',tenant_id:'tenant-b',
      proven_fix:'Fix',regression_ref:'tests/brain-proof.test.mjs',
      evidence:{production_readback_url:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663'}}
  ]}});
  assert.equal(unknown.learning.items[0].healthy,false);
  assert.equal(unknown.learning.items[1].healthy,false);
  assert.deepEqual(nativePageContent('learning-writeback',{portal:{runtime:unknown}})
    .blocks[0].items[1],['Bewezen leerrecords','0']);
});
