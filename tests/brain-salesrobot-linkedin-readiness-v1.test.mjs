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

test('readiness gate runs before AVAILABLE capability and any SalesRobot dispatch',()=>{
 const readiness=source.indexOf('const blocked=salesRobotExecutionBlock(healthy)');
 const available=source.indexOf("dmCapability='AVAILABLE'");
 const send=source.indexOf("'SALESROBOT_SEND_MESSAGE',args");
 assert.ok(readiness>0&&available>readiness&&send>available);
 assert.match(source,/SALESROBOT_(?:EXECUTION_DAYS_EXHAUSTED|ACTIVE_CAMPAIGN_REQUIRED)/);
 assert.match(source,/status:'held',reason:configRequired/);
 assert.match(source,/send_proof:false/);
});

test('existing human approval, message quality, and exact send acknowledgment are retained',()=>{
 assert.match(source,/composerProof\?\.quality_passed!==true/);
 assert.match(source,/action\?\.evidence\?\.human_approved!==true/);
 assert.match(source,/SALESROBOT_RECIPIENT_NOT_ADDRESSABLE/);
 assert.match(source,/provider_ack_verified:true/);
 assert.match(source,/status:'waiting'/);
});
