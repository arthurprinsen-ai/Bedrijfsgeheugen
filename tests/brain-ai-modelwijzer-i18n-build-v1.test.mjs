import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI Modelwijzer build-time English cache covers current governance copy',()=>{
  const cache=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-30-ai-modelwijzer-v2.json','utf8'));
  const required=[
    'De advisor behandelt EU-verwerking als één constraint. Voor gereguleerde of strategische data kan self-hosting of een customer-controlled cloud-deployment zwaarder wegen dan een kleine benchmarkwinst.',
    '-compliance hangt ook af van doel, grondslag, verwerkersafspraken, dataminimalisatie, beveiliging, subprocessors, retentie en jouw concrete implementatie.',
    'Providernaam alleen zegt te weinig.',
    'Bekijk per deploymentpad opslag, inferentie, training, retentie, zero-data-retention, sleutels, private networking en self-hosting.'
  ];
  for(const key of required){
    assert.equal(typeof cache[key],'string');
    assert.ok(cache[key].trim().length>0);
  }
});
