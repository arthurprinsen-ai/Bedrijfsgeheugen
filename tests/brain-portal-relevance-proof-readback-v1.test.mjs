import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePageContent } from '../portal-v2/native-pages.js';
import { mapRuntimeProjection } from '../portal-v2/runtime-evidence.js';

const receipt='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663';
const metrics=items=>nativePageContent('learning-writeback',{portal:{runtime:{learning:{items}}}}).blocks.find(x=>x.type==='metrics').items.slice(0,3);

test('historical replay: old healthy+ok false positive cannot become PROVEN',()=>{
  assert.deepEqual(metrics([{naam:'Twee groene booleans zonder bewijs',healthy:true,status:'ok'}]),[
    ['Leerrecords','1'],['Bewezen leerrecords','0'],['Nog te verifiëren','1']
  ]);
});

test('shadow: explicit PROVEN still needs a provider receipt AND readback',()=>{
  const records=[
    {naam:'alleen status',healthy:true,status:'ok',maturity:'PROVEN'},
    {naam:'niet gecontroleerd',healthy:true,status:'ok',maturity:'PROVEN',proofRef:receipt},
    {naam:'verkeerde bron',healthy:true,status:'ok',maturity:'PROVEN',productionVerified:true,proofRef:'https://example.org/forge'},
    {naam:'gecontroleerd',healthy:true,status:'ok',maturity:'PROVEN',productionVerified:true,proofRef:receipt}
  ];
  assert.deepEqual(metrics(records),[['Leerrecords','4'],['Bewezen leerrecords','1'],['Nog te verifiëren','3']]);
});

test('canary: authenticated memory mapping preserves real receipts and never invents proof from source status',()=>{
  const mapped=mapRuntimeProjection({livingMemory:{memories:[
    {claim:'bewijs',status:'PROVEN',productionVerified:true,evidence:{runUrl:receipt}},
    {claim:'onbewezen',status:'PROVEN'},
    {claim:'rood',status:'OBSERVED',productionVerified:true,evidence:{run_url:receipt}}
  ]}}).learning.items;
  assert.equal(mapped[0].maturity,'PROVEN');
  assert.equal(mapped[0].proofRef,receipt);
  assert.equal(mapped[0].productionVerified,true);
  assert.equal(mapped[1].productionVerified,false);
  assert.equal(mapped[1].proofRef,'');
  assert.equal(mapped[2].maturity,'OBSERVED');
  assert.deepEqual(metrics(mapped),[['Leerrecords','3'],['Bewezen leerrecords','1'],['Nog te verifiëren','2']]);
});
