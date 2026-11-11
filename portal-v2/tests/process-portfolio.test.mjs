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
 assert.throws(()=>instantiateProcess({}, {id,templateId:'reorder',title:'X',targetDate:'2026-02-30'}),/INVALID/);
 const data=instantiateProcess({}, {id,templateId:'service-delivery',title:'Advies'});
 assert.equal(data.processes[0].steps[0].dueDate,null);
 assert.equal(processPortfolioOverview(data).items[0].next,null);
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
