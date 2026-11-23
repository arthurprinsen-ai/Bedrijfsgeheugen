import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {providerUncertaintyNoResend} from '../supabase/functions/_shared/outreach-composer-hold.mjs';
import {verifiedGmailReadback} from '../supabase/functions/_shared/verified-gmail-readback.mjs';

const sender=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');

test('a crash after the original atomic claim cannot resend, even with no provider id',()=>{
 const claim=sender.indexOf("const sendIntent={...(a.evidence||{}),autonomous_outbound:{");
 const checkpoint=sender.indexOf(".update({status:'waiting',updated_at:now,evidence:sendIntent})",claim);
 const attempt=sender.indexOf('ack=await send(key,acct,to,sub,withOptOutLine(body))',claim);
 assert.ok(claim>0&&checkpoint>claim&&attempt>checkpoint,'pre-send persisted before any Gmail attempt');
 assert.match(sender,/\.eq\('updated_at',a\.updated_at\)\.select\('action_id'\)/);
 assert.match(sender,/delivery_state:'PROVIDER_OUTCOME_UNKNOWN'/);
 assert.match(sender,/republish_forbidden:true/);
 assert.match(sender,/provider_message_id:null/);
 assert.equal(providerUncertaintyNoResend({autonomous_outbound:{needs_readback:true,republish_forbidden:true,provider_message_id:null}}),true);
 assert.match(sender,/if\(providerUncertaintyNoResend\(a\?\.evidence\)\)/);
});

test('original Gmail connection is pinned fail closed rather than arbitrary active account',()=>{
 assert.match(sender,/GMAIL_PINNED_ACCOUNT_NOT_ACTIVE/);
 assert.match(sender,/if\(!exact\)throw/);
 assert.match(sender,/GMAIL_CONNECTION_AMBIGUOUS/);
});

test('provider outcome has immutable dedupe and independent exact-id proof',()=>{
 assert.match(sender,/ignoreDuplicates:true/);
 assert.match(sender,/const outcomeKey='autonomous-email-sent:'\+a\.action_id/);
 assert.match(sender,/\.eq\('dedupe_key',outcomeKey\)\.maybeSingle\(\)/);
 assert.match(sender,/ORIGINAL_PROVIDER_OUTCOME_READBACK_CONFLICT/);
 assert.match(sender,/outcome\.action_id!==a\.action_id/);
 assert.match(sender,/outcome\.evidence\?\.provider_readback_verified!==true/);
 const response={data:{messageId:'exact-id',labelIds:['SENT'],payload:{headers:[{name:'To',value:'person@company.com'}]}}};
 assert.equal(verifiedGmailReadback(response,'exact-id','person@company.com').ok,true);
 assert.equal(verifiedGmailReadback(response,'incorrect','person@company.com').ok,false);
});

test('14-day recent real delivery or uncertain same-person send holds the original prepared action',()=>{
 assert.match(sender,/Date\.parse\(now\)-14\*86400000/);
 assert.match(sender,/\.eq\('outcome_type','sent'\)\.eq\('channel','email'\)/);
 assert.match(sender,/\.contains\('evidence',\{autonomous_outbound:\{needs_readback:true\}\}\)/);
 assert.match(sender,/RECIPIENT_CONTACT_PRESSURE_14D/);
 assert.match(sender,/RECIPIENT_PENDING_PROVIDER_READBACK/);
 assert.match(sender,/next_action:'RECHECK_ORIGINAL_RECIPIENT_OUTCOME_BEFORE_NEXT_SEND'/);
});

test('measurement never attributes historical readback as a new provider send',()=>{
 assert.match(sender,/priorReadbacksSettled\+\+/);
 assert.match(sender,/providerAttemptedNow\+\+/);
 assert.match(sender,/verifiedNewSends\+\+/);
 assert.match(sender,/ignoreDuplicates:true/);
 assert.match(sender,/provider_timestamp:'UNKNOWN'/);
 assert.match(sender,/external_outreach_executed:providerAttemptedNow>0/);
 assert.match(sender,/verified_new_sends:verifiedNewSends/);
 assert.match(sender,/prior_readbacks_settled:priorReadbacksSettled/);
});
