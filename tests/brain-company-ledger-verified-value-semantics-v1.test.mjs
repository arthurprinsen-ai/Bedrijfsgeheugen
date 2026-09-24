import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrainRecord} from '../brain/operating-loop/model.mjs';
import {buildCompanyLedger} from '../brain/operating-loop/company-ledger.mjs';

test('legacy realized economics remain backward compatible while PH verified value stays strict',()=>{
  const records=[
    normalizeBrainRecord({tenantId:'t1',type:'Value',id:'legacy',status:'REALISED',realizedValue:12000,currency:'EUR',verified:true}),
    {tenantId:'t1',kind:'value',id:'strict',verified:true,executed:true,evidenceIds:['ev-1'],problemId:'PH-P003',economics:{realizedValue:5000,currency:'EUR'}},
    {tenantId:'t1',kind:'value',id:'unexecuted',verified:true,executed:false,evidenceIds:['ev-2'],problemId:'PH-P003',economics:{realizedValue:9000,currency:'EUR'}}
  ];
  const ledger=buildCompanyLedger(records,{tenantId:'t1'});
  assert.equal(ledger.economics.realizedValue,26000);
  assert.equal(ledger.verifiedValueByProblem.length,1);
  assert.equal(ledger.verifiedValueByProblem[0].problemId,'PH-P003');
  assert.equal(ledger.verifiedValueByProblem[0].realizedValue,5000);
  assert.deepEqual(ledger.verifiedValueByProblem[0].evidenceIds,['ev-1']);
});
