import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');
const block=source.match(/function salesRobotExecutionBlock\(account:any\):string\|null\{[\s\S]*?\n\}/)?.[0];
assert.ok(block,'SalesRobot readiness must be independently enforceable before external sends');
const safe=block.replace('account:any):string|null{','account){');
const check=new Function('clean',safe+'\nreturn salesRobotExecutionBlock;')((v)=>String(v??'').trim());

const healthy=(more={})=>({
 healthStatus:'HEALTHY',cookieExpired:false,paymentStatus:'ACTIVE',
 daysOfExecutionRemaining:5,hasCampaigns:true,hasActiveCampaigns:true,...more
});

test('execution days zero fails closed independently from UI trial days',()=>{
 assert.equal(check(healthy({daysOfExecutionRemaining:0})),'SALESROBOT_EXECUTION_DAYS_EXHAUSTED');
 assert.equal(check(healthy({daysOfExecutionRemaining:null})),'SALESROBOT_EXECUTION_DAYS_EXHAUSTED');
 assert.equal(check(healthy({daysOfExecutionRemaining:undefined})),'SALESROBOT_EXECUTION_DAYS_EXHAUSTED');
});

test('draft, campaign-less and unlicensed states cannot claim provider delivery readiness',()=>{
 assert.equal(check(healthy({hasCampaigns:false})),'SALESROBOT_CAMPAIGN_REQUIRED');
 assert.equal(check(healthy({hasActiveCampaigns:false})),'SALESROBOT_ACTIVE_CAMPAIGN_REQUIRED');
 assert.equal(check(healthy({subscription:'TRIAL_EXPIRED',paymentStatus:'TRIAL_EXPIRED'})),'SALESROBOT_BILLING_INACTIVE');
 assert.equal(check(healthy()),null);
});

test('provider preflight stays fail-closed before SalesRobot dispatch',()=>{
 const readiness=source.indexOf('const blocked=salesRobotExecutionBlock(healthy)');
 const send=source.indexOf("'SALESROBOT_SEND_MESSAGE',args");
 assert.ok(readiness>0&&send>readiness);
 assert.match(source,/SALESROBOT_LINKEDIN_ACCOUNT_NOT_HEALTHY/);
 assert.match(source,/dmCapability='CONFIG_REQUIRED'/);
 assert.match(source,/send_proof:false/);
});

test('ambiguous provider write cannot be automatically requeued or resent',()=>{
 const begin=source.indexOf('}catch(dmError:any){');
 const end=source.indexOf('}catch(srError:any){',begin);
 assert.ok(begin>0&&end>begin);
 const catchBlock=source.slice(begin,end);
 assert.match(catchBlock,/status:'waiting'/);
 assert.doesNotMatch(catchBlock,/status:'suggested'/);
 assert.match(catchBlock,/needs_readback:true/);
 assert.match(catchBlock,/republish_forbidden:true/);
 assert.match(catchBlock,/requires_provider_readback:true/);
 assert.match(catchBlock,/fallback_required:false/);
 assert.match(catchBlock,/SALESROBOT_SEND_OUTCOME_AMBIGUOUS/);
});

test('existing human approval, message quality, and exact send acknowledgment are retained',()=>{
 assert.match(source,/composerProof\?\.quality_passed!==true/);
 assert.match(source,/action\?\.evidence\?\.human_approved!==true/);
 assert.match(source,/SALESROBOT_RECIPIENT_NOT_ADDRESSABLE/);
 assert.match(source,/provider_ack_verified:true/);
 assert.match(source,/status:'waiting'/);
});

test('read-only canary returns before mutating preparatory SQL or composer',()=>{
 const preflight=source.indexOf('let srPreflight:any=null');
 const dry=source.indexOf('if(dryRun){');
 const prep=source.indexOf("db.rpc('powerhouse_prepare_linkedin_sales_machine_v1'");
 const composer=source.indexOf("const composerResponse=await fetch(");
 assert.ok(preflight>0&&dry>preflight&&prep>dry&&composer>prep);
 const segment=source.slice(dry,prep);
 assert.match(segment,/canonical_mutations:false/);
 assert.match(segment,/external_side_effects:false/);
 assert.doesNotMatch(segment,/\.update\(|\.upsert\(|\.insert\(|powerhouse_refresh_message_plans_v1|powerhouse_prepare_linkedin_sales_machine_v1/);
 assert.ok(source.indexOf("await recordCapability(db,'salesrobot.linkedin_dm',providerStatus")>dry);
});

test('provider readiness is recorded before AI/composer failures; errors propagate',()=>{
 const readiness=source.indexOf("await recordCapability(db,'salesrobot.linkedin_dm',providerStatus");
 const composer=source.indexOf('const composerResponse=await fetch(');
 const aiKey=source.indexOf("secret(db,'ANTHROPIC_API_KEY')");
 assert.ok(readiness>0&&composer>readiness&&aiKey>readiness);
 assert.match(source,/if\(error\)throw new Error\('SALESROBOT_CAPABILITY_WRITE:'/);
 assert.match(source,/await recordCapability\(db,'salesrobot.campaign_outreach',providerStatus/);
 assert.match(source,/const sr=srPreflight/);
 assert.doesNotMatch(source,/const sr=await salesRobotContext\(db\)/);
});

test('Composio v3.1 transport includes exact user_id on read-only probe and any approved DM',()=>{
 assert.match(source,/async function composioExecuteArgs\(apiKey:string,connectedAccountId:string,userId:string/);
 assert.match(source,/if\(!clean\(userId\)\|\|!clean\(connectedAccountId\)\)throw new Error\('SALESROBOT_COMPOSIO_IDENTITY_MISSING'\)/);
 assert.match(source,/connected_account_id:connectedAccountId,user_id:userId,version:'latest',arguments:args/);
 assert.match(source,/const userId=clean\(connected\?\.user_id\)/);
 assert.match(source,/const probe=await composioExecuteArgs\(apiKey,connectedAccountId,userId,'SALESROBOT_LIST_LINKEDIN_ACCOUNTS'/);
 assert.match(source,/const sent=await composioExecuteArgs\(sr.apiKey,sr.connectedAccountId,sr.userId,'SALESROBOT_SEND_MESSAGE'/);
 assert.match(source,/signal:AbortSignal.timeout\(18000\)/);
 assert.doesNotMatch(source,/composioExecuteArgs\(apiKey,connectedAccountId,'SALESROBOT_/);
});

test('direct LinkedIn DM requires independently authorized CRM identity',()=>{
 assert.match(source,/async function approvedLinkedinRecipient\(db:any,action:any\)/);
 assert.match(source,/authority\.human_approved===true/);
 assert.match(source,/authority\.do_not_contact!==true/);
 assert.match(source,/LINKEDIN_RECIPIENT_CRM_APPROVAL_NOT_PROVEN/);
 assert.ok(source.indexOf("if(!await approvedLinkedinRecipient(db,action))")<
   source.indexOf("'SALESROBOT_SEND_MESSAGE',args"));
});

test('provider acknowledgement is not a delivered DM; awaiting inbox receipt is fail-closed',()=>{
 const start=source.indexOf('let tentativeAck:any=null;');
 const end=source.indexOf('}catch(dmError:any){',start);
 const sending=source.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(sending,/provider_ack_received:true/);
 assert.match(sending,/provider_ack_verified:false/);
 assert.match(sending,/provider_readback_verified:false/);
 assert.match(sending,/needs_readback:true/);
 assert.match(sending,/republish_forbidden:true/);
 assert.match(sending,/status:'waiting'/);
 assert.doesNotMatch(sending,/status:'done'/);
 assert.doesNotMatch(sending,/status:'executed'/);
});

test('verified inbox event is the only allowed SalesRobot done transition',()=>{
 const start=source.indexOf('async function reconcileVerifiedSalesRobotReceipts(db:any)');
 const end=source.indexOf('async function generateComment(',start);
 const readback=source.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(readback,/salesrobot_linkedin_dm_sent/);
 assert.match(readback,/provider_inbox_readback!==true/);
 assert.match(readback,/inbox_message_sent_by_me!==true/);
 assert.match(readback,/provider_prospect_uuid/);
 assert.match(readback,/inbox_message_id/);
 assert.match(readback,/powerhouse_sales_outcomes/);
 assert.match(readback,/provider_readback_verified:true/);
 assert.match(readback,/status:'done'/);
 assert.match(readback,/needs_readback:false/);
 assert.match(source,/verified_receipts_reconciled:reconciledDms.length/);
});

test('SalesRobot exact provider root causes survive disconnected adapter and do not produce fake GREEN',()=>{
 assert.match(source,/class SalesRobotProviderBlock extends Error/);
 assert.match(source,/payment_status:payment/);
 assert.match(source,/cookie_expired:observed\?\.cookieExpired===true/);
 assert.match(source,/SALESROBOT_EXECUTION_DAYS_EXHAUSTED/);
 assert.match(source,/SALESROBOT_BILLING_INACTIVE/);
 assert.match(source,/blockers:problems/);
 assert.match(source,/srPreflightDetails=err\?\.evidence\|\|\{\}/);
 assert.match(source,/\.\.\.srPreflightDetails/);
});

test('preflight-only mode reuses existing provider probe and records status before composer without sending',()=>{
 const a=source.indexOf("if(input?.mode==='provider_preflight'){");
 const b=source.indexOf("const composerResponse=await fetch(");
 const c=source.indexOf("await recordCapability(db,'salesrobot.linkedin_dm',providerStatus");
 assert.ok(a>0&&b>a&&c<a);
 assert.match(source.slice(a,b),/external_side_effects:false,commercial_outbound_sent:false,composer_called:false/);
 assert.match(source.slice(a,b),/existing_canonical_scheduler:true/);
 assert.doesNotMatch(source.slice(a,b),/SALESROBOT_SEND_MESSAGE/);
});

test('DM dry-run distinguishes suggested actions from recipient approved and provider addressable',()=>{
 const start=source.indexOf('if(dryRun){'),end=source.indexOf("await recordCapability(db,'salesrobot.linkedin_dm',providerStatus",start);
 const segment=source.slice(start,end);
 assert.match(segment,/dm_action_approved/);
 assert.match(segment,/dm_provider_addressable/);
 assert.match(segment,/dm_crm_recipient_approved/);
 assert.match(segment,/dm_ready_for_send/);
 assert.match(segment,/await approvedLinkedinRecipient\(db,action\)/);
 assert.match(segment,/canonical_mutations:false/);
});
