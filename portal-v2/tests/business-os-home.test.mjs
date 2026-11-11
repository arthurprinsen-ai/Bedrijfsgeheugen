import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildOneRoofModel} from '../business-os-home.js';

const journey={
 authenticated:true,steps:[{id:'scan',confirmed:true}],
 brainReceipt:{acknowledged:true},
 autopilot:{autonomousExecutionVerified:false,freshRuntime:false,outcomes:0,learned:0}
};
test('one roof denies unauthenticated users and never reveals tenant data',()=>{
 const model=buildOneRoofModel({authenticated:false,state:{tenant_id:'private'},journey});
 assert.equal(model.authenticated,false);assert.equal(model.domains.length,0);
 assert.equal(model.stages.length,0);
});
test('one roof navigates ONLY to the canonical original Portal V2 page registry',()=>{
 const model=buildOneRoofModel({authenticated:true,state:{portal:{}},journey});
 assert.equal(model.domains.length,6);
 assert.deepEqual(model.domains.map(x=>x.page),[
  'bedrijfssituatie','taken-werkstromen','sales-intelligence','mensen','businesscase','koppelingen'
 ]);
});
test('a Brain input ACK is not proof of execution, measurement or learning',()=>{
 const model=buildOneRoofModel({authenticated:true,state:{portal:{}},journey});
 assert.equal(model.stages.find(x=>x.id==='brain').status,'confirmed');
 assert.equal(model.stages.find(x=>x.id==='execution').status,'unverified');
 assert.equal(model.stages.find(x=>x.id==='outcome').status,'unverified');
 assert.equal(model.stages.find(x=>x.id==='learning').status,'unverified');
 assert.equal(model.closed,false);
});
test('pending original handoff cannot be treated as received even with producer echo',()=>{
 const model=buildOneRoofModel({authenticated:true,state:{},journey,pendingHandoff:{pending:true}});
 assert.equal(model.stages.find(x=>x.id==='brain').status,'pending');
 assert.match(model.summary,/originele overdracht/);
});
test('strict evidence chain requires verified execution, fresh runtime, outcome and next learning',()=>{
 const base={authenticated:true,state:{},journey:{...journey,autopilot:{autonomousExecutionVerified:true,freshRuntime:true,outcomes:1,learned:1}}};
 const good=buildOneRoofModel(base);
 assert.equal(good.closed,true);
 const lost=buildOneRoofModel({...base,journey:{...base.journey,autopilot:{...base.journey.autopilot,learned:0}}});
 assert.equal(lost.closed,false);
 assert.equal(lost.stages.find(x=>x.id==='learning').status,'unverified');
});
test('only original authenticated runtime is rendered; no second writer, scheduler or HTTP API',()=>{
 const source=readFileSync(new URL('../business-os-home.js',import.meta.url),'utf8');
 const home=readFileSync(new URL('../entrepreneur-home.js',import.meta.url),'utf8');
 assert.match(home,/renderOneRoofWorkspace\(advanced,/);
 assert.match(home,/stateClient\.getSnapshot\(\)\?\.state/);
 assert.match(source,/data|dataset/);
 assert.doesNotMatch(source,/fetch\(|setInterval|localStorage|sessionStorage|Math\.random|cron\.schedule|new Scheduler/);
});
