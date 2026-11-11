import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {instantiateProcess,recordProcessStepIntent,processPortfolioOverview,PROCESS_TEMPLATES} from '../modules/process-portfolio.js';
import {processPortfolioMarkup} from '../modules/process-portfolio-view.js';
const id='p-12345678',i1='i-11111111',i2='i-22222222',date='2026-11-11T11:00:00Z';
const create=()=>instantiateProcess({features:[{id:'f1'}]},{id,templateId:'product-intro',title:'Nieuwe SKU',owner:'Team A',targetDate:'2026-12-31'});
test('four generic templates stay in original deliveryPlan without a second engine',()=>{
 assert.equal(PROCESS_TEMPLATES.length,4);
 const data=create();assert.equal(data.features.length,1);assert.equal(data.processes.length,1);
 assert.deepEqual(data.processes[0].steps[1].dependsOn,['intake']);
 assert.equal(data.processes[0].steps.at(-1).dueDate,'2026-12-31');
 assert.equal(instantiateProcess(data,{id,templateId:'product-intro',title:'Andere titel'}).processes.length,1);
});
test('dependency, owner and approval gates cannot be bypassed by customer click',()=>{
 let data=create();
 assert.equal(processPortfolioOverview(data).items[0].next.id,'intake');
 assert.throws(()=>recordProcessStepIntent(data,{processId:id,stepId:'requirements',action:'submit',intentId:i1,observedAt:date}),/NOT_READY/);
 data=recordProcessStepIntent(data,{processId:id,stepId:'intake',action:'submit',intentId:i1,observedAt:date});
 assert.equal(data.processes[0].steps[0].evidence.verified,false);
 assert.equal(recordProcessStepIntent(data,{processId:id,stepId:'intake',action:'submit',intentId:i1,observedAt:date}).processes[0].steps[0].intentId,i1);
 data=recordProcessStepIntent(data,{processId:id,stepId:'requirements',action:'submit',intentId:i2,observedAt:date});
 assert.throws(()=>recordProcessStepIntent(data,{processId:id,stepId:'review',action:'submit',intentId:'i-33333333',observedAt:date}),/APPROVAL_RECEIPT_REQUIRED/);
 data=recordProcessStepIntent(data,{processId:id,stepId:'review',action:'request',intentId:'i-33333333',observedAt:date});
 assert.equal(processPortfolioOverview(data).items[0].pendingApprovals,1);
 assert.equal(processPortfolioOverview(data).items[0].closedVerified,false);
 assert.throws(()=>recordProcessStepIntent(data,{processId:id,stepId:'prepare',action:'submit',intentId:'i-44444444',observedAt:date}),/NOT_READY/);
});
test('never create dated tasks without a valid customer-provided deadline or title',()=>{
 assert.throws(()=>instantiateProcess({}, {id,templateId:'reorder',title:'X',owner:'Lead',targetDate:'2026-02-30'}),/INVALID/);
 const data=instantiateProcess({}, {id,templateId:'service-delivery',title:'Advies',owner:'Lead'});
 assert.equal(data.processes[0].steps[0].dueDate,null);
 assert.equal(processPortfolioOverview(data).items[0].next.id,'discovery');
 assert.throws(()=>instantiateProcess({}, {id:'p-87654321',templateId:'reorder',title:'Bestelling'}),/OWNER_REQUIRED/);
 assert.throws(()=>instantiateProcess({}, {id,templateId:'reorder',title:''}),/TITLE_REQUIRED/);
});
test('mobile-first disclosure escapes customer text and makes unverified status explicit',()=>{
 const data=instantiateProcess({}, {id,templateId:'reorder',title:'<img src=x onerror=alert(1)>',owner:'Team'});
 const html=processPortfolioMarkup(data,{today:'2026-11-11'});
 assert.match(html,/data-process-portfolio/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/ONE BRAIN-ontvangst/);
 assert.match(html,/data-process-create/);
});
test('original board retains one canonical writer and no new process scheduler or provider-sent approval',()=>{
 const board=readFileSync(new URL('../modules/delivery-board.js',import.meta.url),'utf8');
 const process=readFileSync(new URL('../modules/process-portfolio.js',import.meta.url),'utf8');
 assert.match(board,/domainState\.set\('portal\.deliveryPlan',state\)/);
 assert.match(board,/processPortfolioMarkup\(state\)/);
 assert.match(board,/bindProcessPortfolio/);
 assert.doesNotMatch(process,/fetch\(|localStorage|sessionStorage|setInterval|cron\.schedule|service_role/);
});

test('original workflow changes invalidate relevant domain pages without claiming execution or economics',async()=>{
 const {sourcePageForPath,impactForMutation}=await import('../portal-impact-engine.js');
 assert.equal(sourcePageForPath('portal.deliveryPlan'),'taken-werkstromen');
 const impact=impactForMutation({path:'portal.deliveryPlan',before:{portal:{deliveryPlan:{processes:[]}}},after:{portal:{deliveryPlan:{processes:[{id:'p-12345678'}]}}}});
 for(const page of ['taken-werkstromen','roadmap','mensen','businesscase','advies'])assert.ok(impact.affectedPages.includes(page),page);
 assert.ok(impact.reviewDomains.includes('process'));
 assert.equal(impact.externalExecutionAuthorized,false);
 assert.equal(impact.evidenceStatus,'OBSERVED_NOT_VERIFIED');
});

test('scoped process Brain receipt only after exact binding, causal impact and independent authority ACK',async()=>{
 const {verifiedProcessBrainReceipt}=await import('../modules/process-portfolio.js');
 const scope=Symbol('tenant-domain');
 const ack={statePath:'portal.deliveryPlan',bindingGeneration:2,stored:true,stale:false,
  authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,
  sourceRevision:'rev-A',brainRecordId:'brain-A',currentStateRecordId:'current-A',organismImpactRecordId:'impact-A'};
 const detail={receiptScope:scope,stored:[ack],impacts:[{path:'portal.deliveryPlan',generation:1,evidenceStatus:'OBSERVED_NOT_VERIFIED'}]};
 const opts={scope,pending:{pending:false}};
 const out=verifiedProcessBrainReceipt(detail,opts);
 assert.equal(out.status,'BRAIN_INPUT_ACK');
 assert.deepEqual([out.providerExecutionVerified,out.measuredOutcomeVerified,out.learningVerified],[false,false,false]);
 assert.match(processPortfolioMarkup(create(),{handoffEvidence:out}),/brain-A/);
 assert.equal(verifiedProcessBrainReceipt({...detail,receiptScope:Symbol('wrong-tenant')},opts),null);
 assert.equal(verifiedProcessBrainReceipt(detail,{scope,pending:{pending:true}}),null);
 for(const overrides of [{stale:true},{authorityStored:false},{organismImpactStored:false},{statePath:'portal.profile'}, {brainRecordId:''}]){
  assert.equal(verifiedProcessBrainReceipt({...detail,stored:[{...ack,...overrides}]},opts),null);
 }
 assert.equal(verifiedProcessBrainReceipt({...detail,stored:[ack,ack]},opts),null);
 assert.equal(verifiedProcessBrainReceipt({...detail,impacts:[]},opts),null);
 assert.doesNotMatch(processPortfolioMarkup(create()),/BRAIN_INPUT_ACK/);
});
test('the original UI keeps disclosure open after mutations and exposes domain-scoped receipt',()=>{
 const board=readFileSync(new URL('../modules/delivery-board.js',import.meta.url),'utf8');
 const domain=readFileSync(new URL('../domain-state.js',import.meta.url),'utf8');
 assert.match(board,/wasOpen=Boolean/);
 assert.match(board,/disclosure\.open=wasOpen/);
 assert.match(board,/receiptListeners=new WeakMap/);
 assert.match(domain,/receiptScope=Symbol/);
 assert.match(domain,/stored\.push\(\{\.\.\.saved,statePath:item\.statePath,bindingGeneration:item\.generation\}\)/);
});
