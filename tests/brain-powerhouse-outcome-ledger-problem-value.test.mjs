import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompanyLedger} from '../brain/operating-loop/company-ledger.mjs';
import {projectVerifiedValue} from '../brain/operating-loop/verified-value.mjs';
import {buildCompanyCockpit} from '../portal-v2/company-cockpit.js';
import {renderCompanyCockpitHtml} from '../portal-v2/company-cockpit-ui.js';

const base={tenantId:'t1',owner:'ops',executed:true,verified:true,result:'improved',evidenceIds:['ev-1'],payload:{realised:true,realisedValue:12500,valueUnit:'EUR'}};

test('verified value is grouped by canonical PH problem id',()=>{
 const records=[
  {...base,id:'v1',kind:'value',problemId:'PH-P007'},
  {...base,id:'v2',kind:'value',references:['problem:PH-P007'],evidenceIds:['ev-2'],payload:{realised:true,realisedValue:2500,valueUnit:'EUR'}},
  {...base,id:'v3',kind:'value',problemId:'LOCAL-1'}
 ];
 const projection=projectVerifiedValue(records);
 assert.equal(projection.verifiedValueByProblem.length,1);
 assert.equal(projection.verifiedValueByProblem[0].problemId,'PH-P007');
 assert.equal(projection.verifiedValueByProblem[0].totals.EUR,15000);
 assert.deepEqual(projection.verifiedValueByProblem[0].evidenceIds.sort(),['ev-1','ev-2']);
});

test('company ledger preserves verified economics while Verified Value Created stays evidence-backed',()=>{
 const records=[
  {...base,id:'v1',kind:'value',problem_id:'PH-P003',economics:{realizedValue:10000,currency:'EUR'}},
  {...base,id:'v2',kind:'value',problem_id:'PH-P003',executed:false,economics:{realizedValue:90000,currency:'EUR'}},
  {...base,id:'v3',kind:'value',problem_id:'PH-P003',evidenceIds:[],economics:{realizedValue:50000,currency:'EUR'}}
 ];
 const ledger=buildCompanyLedger(records,{tenantId:'t1'});
 assert.equal(ledger.economics.realizedValue,150000);
 assert.equal(ledger.verifiedValueByProblem.length,1);
 assert.equal(ledger.verifiedValueByProblem[0].problemId,'PH-P003');
 assert.equal(ledger.verifiedValueByProblem[0].realizedValue,10000);
});

test('company cockpit renders Verified Value Created per PH problem',()=>{
 const runtime={verifiedValueByProblem:[{problemId:'PH-P001',realizedValue:42000,outcomes:2,evidenceIds:['a','b']}],timeline:{items:[]},portfolio:{NOW:[]}};
 const model=buildCompanyCockpit(runtime);
 assert.equal(model.sections.find(x=>x.key==='verified-value').items[0].problemId,'PH-P001');
 const html=renderCompanyCockpitHtml(runtime);
 assert.match(html,/Verified Value Created/);
 assert.match(html,/PH-P001/);
 assert.match(html,/42\.000/);
 assert.match(html,/2 bewijsreferenties/);
});
