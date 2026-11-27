import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {instantiateProcess,recordProcessStepIntent,pendingProcessHandoffs,processPortfolioOverview} from '../portal-v2/modules/process-portfolio.js';

test('single original tenant-owned process surface never interprets customer save as final consumer result',()=>{
 const create=()=>instantiateProcess({stories:[{id:'old'}]},{id:'p-12345678',templateId:'service-delivery',title:'Klantvraag',owner:'Adviseur'});
 let state=create();
 state=recordProcessStepIntent(state,{processId:'p-12345678',stepId:'discovery',action:'submit',intentId:'i-12345678',observedAt:'2026-11-11T16:00:00Z'});
 const before=JSON.stringify(state);
 const pending=pendingProcessHandoffs(state);
 assert.equal(pending.length,1);
 assert.equal(pending[0].intentId,'i-12345678');
 assert.equal(pending[0].owner,'Adviseur');
 assert.equal(processPortfolioOverview(state).fullyVerified,0);
 assert.equal(JSON.stringify(state),before);
 assert.deepEqual(state.stories,[{id:'old'}]);
 const source=readFileSync(new URL('../portal-v2/modules/process-portfolio.js',import.meta.url),'utf8');
 const board=readFileSync(new URL('../portal-v2/modules/delivery-board.js',import.meta.url),'utf8');
 const agent=readFileSync(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
 const skill=readFileSync(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8');
 assert.match(board,/domainState\.set\('portal\.deliveryPlan',state\)/);
 assert.match(agent,/audit-process-step-intents-and-missing-independent-consumer-receipts-per-tenant-revision/);
 assert.match(skill,/missing-independent-stage-receipt-visibility/);
 for(const txt of [source])assert.doesNotMatch(txt,/fetch\(|localStorage|sessionStorage|setInterval|cron\.schedule|service_role/);
});
