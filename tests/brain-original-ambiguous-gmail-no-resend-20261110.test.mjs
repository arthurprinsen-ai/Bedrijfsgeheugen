import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {providerUncertaintyNoResend} from '../supabase/functions/_shared/outreach-composer-hold.mjs';

const sender=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');

test('prior accepted provider effect always fences out any future resend, even if watchdog requeues prepared',()=>{
 const id='gmail-opaque-provider-id';
 for(const evidence of [
  {autonomous_outbound:{needs_readback:true,republish_forbidden:true,provider_message_id:id}},
  {autonomous_outbound:{provider_message_id:id,provider_ack_verified:false,provider_readback_verified:false}},
  {autonomous_outbound:{provider_message_id:id,provider_ack_verified:true,provider_readback_verified:true}},
  {autonomous_outbound:{needs_readback:true}},
  {autonomous_outbound:{republish_forbidden:true}},
  {provider_ambiguity_quarantine:{external_resend_forbidden:true}},
  {native_gmail_executor:{provider_message_id:id}},
  {provider_message_id:id}
 ])assert.equal(providerUncertaintyNoResend(evidence),true);
 assert.equal(providerUncertaintyNoResend({}),false);
 assert.equal(providerUncertaintyNoResend({autonomous_outbound:{provider_message_id:'',needs_readback:false,republish_forbidden:false}}),false);
});
test('original Edge sender applies no-resend barrier before recipient authority, quality gate and provider SEND',()=>{
 const pivot=sender.indexOf('for(const a of acts||[]){');
 const fence=sender.indexOf('if(providerUncertaintyNoResend(a?.evidence))',pivot);
 const authority=sender.indexOf('verifyRecipientAuthority(db,a,to)',pivot);
 const send=sender.indexOf('await send(key,acct,to,sub,withOptOutLine(body))',pivot);
 assert.ok(pivot>=0&&fence>pivot&&authority>fence&&send>authority);
 assert.match(sender,/const\{data:reclaimed,error:reclaimErr\}=await db\.from\('powerhouse_sales_actions'\)/);
 assert.match(sender,/\.update\(\{status:'waiting',updated_at:now,evidence:quarantine\}\)/);
 assert.match(sender,/\.eq\('action_id',a\.action_id\)\.eq\('status','prepared'\)/);
 assert.match(sender,/reason:'PRIOR_PROVIDER_SEND_UNCERTAIN_NO_RESEND'/);
 assert.match(sender,/provider_send_attempted:false/);
 assert.match(sender,/if\(!providerUncertaintyNoResend\(a\?\.evidence\)&&await verifyRecipientAuthority/);
});
test('existing sender retains original pending-readback lineage and uncertainty no-resend',()=>{
 assert.match(sender,/\.eq\('status','waiting'\)\.contains\('evidence',\{autonomous_outbound:\{needs_readback:true\}\}\)/);
 assert.match(sender,/GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID/);
 assert.match(sender,/id!==messageId/);
 assert.match(sender,/sent_label:labels\.includes\('SENT'\)/);
 assert.match(sender,/republish_forbidden:true/);
 assert.match(sender,/powerhouse_email_contact_suppressions/);
 assert.match(sender,/verifyRecipientAuthority/);
 assert.match(sender,/COMPOSIO_GMAIL_SEND_UNCERTAIN/);
});
