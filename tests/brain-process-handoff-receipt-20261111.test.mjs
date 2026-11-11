import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedProcessBrainReceipt} from '../portal-v2/modules/process-portfolio.js';
test('authenticated original domain and causal receipt required for source-only process Brain green',()=>{
 const scope=Symbol('domain'),ack={statePath:'portal.deliveryPlan',bindingGeneration:1,stored:true,stale:false,
 authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,
 sourceRevision:'s1',brainRecordId:'b1',currentStateRecordId:'c1',organismImpactRecordId:'i1'};
 const detail={receiptScope:scope,stored:[ack],impacts:[{path:'portal.deliveryPlan',generation:1,evidenceStatus:'OBSERVED_NOT_VERIFIED'}]};
 const found=verifiedProcessBrainReceipt(detail,{scope,pending:{pending:false}});
 assert.equal(found.status,'BRAIN_INPUT_ACK');
 assert.deepEqual([found.providerExecutionVerified,found.measuredOutcomeVerified,found.learningVerified],[false,false,false]);
 assert.equal(verifiedProcessBrainReceipt(detail,{scope:Symbol('other'),pending:{pending:false}}),null);
 const board=readFileSync(new URL('../portal-v2/modules/delivery-board.js',import.meta.url),'utf8');
 const domain=readFileSync(new URL('../portal-v2/domain-state.js',import.meta.url),'utf8');
 assert.match(board,/domainState\.set\('portal\.deliveryPlan',state\)/);
 assert.match(domain,/HANDOFF_JOURNAL_PATH='portal\.__brainHandoffJournalV1'/);
 for(const code of [board,verifiedProcessBrainReceipt.toString()])assert.doesNotMatch(code,/setInterval|cron\.schedule|service_role|create table/);
});
