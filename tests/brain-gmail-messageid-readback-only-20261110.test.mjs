import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedGmailReadback} from '../supabase/functions/_shared/verified-gmail-readback.mjs';
const sender=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');
const ID='1a1c4b1f339a051f',TO='contact@example.org',THREAD='1a1c4b1f339a051f';
const provider={successful:true,data:{data:{messageId:ID,threadId:THREAD,labelIds:['SENT'],
  payload:{headers:[{name:'To',value:'Contact <contact@example.org>'},{name:'Subject',value:'Relevant business note'}]}}}};

test('actual Composio Gmail fetch response messageId camelCase produces exact independent proof',()=>{
 const result=verifiedGmailReadback(provider,ID,TO);
 assert.deepEqual(result,{ok:true,id_matches:true,sent_label:true,recipient_matches:true,message_id:ID,thread_id:THREAD});
});

test('alternate legacy Gmail id shapes retain exact provider ID requirements',()=>{
 for(const key of ['id','message_id','messageId']){
   const x=structuredClone(provider);delete x.data.data.messageId;x.data.data[key]=ID;
   assert.equal(verifiedGmailReadback(x,ID,TO).ok,true);
 }
});

test('missing/wrong Gmail message IDs, SENT label or recipient all fail closed',()=>{
 const noId=structuredClone(provider);delete noId.data.data.messageId;
 assert.equal(verifiedGmailReadback(noId,ID,TO).ok,false);
 const wrongId=structuredClone(provider);wrongId.data.data.messageId='wrong';
 assert.equal(verifiedGmailReadback(wrongId,ID,TO).id_matches,false);
 const noSent=structuredClone(provider);noSent.data.data.labelIds=['INBOX'];
 assert.equal(verifiedGmailReadback(noSent,ID,TO).sent_label,false);
 const wrongTo=structuredClone(provider);wrongTo.data.data.payload.headers[0].value='Other <other@example.org>';
 assert.equal(verifiedGmailReadback(wrongTo,ID,TO).recipient_matches,false);
 assert.equal(verifiedGmailReadback(provider,ID,'').ok,false);
 assert.equal(verifiedGmailReadback(provider,'',TO).ok,false);
});

test('external response wrapper ID cannot hide a matching provider messageId',()=>{
 const x=structuredClone(provider);x.data.data.id='provider_request_wrapper_id';
 assert.equal(verifiedGmailReadback(x,ID,TO).ok,true);
 const y=structuredClone(provider);y.data.data.messageId='wrong';
 assert.equal(verifiedGmailReadback(y,ID,TO).ok,false);
});

test('original sender runs pending readback before any new send and exposes authenticated readback-only termination',()=>{
 const entry=sender.indexOf("if(req.method!=='POST')");
 const auth=sender.indexOf("req.headers.get('x-powerhouse-token')");
 const pending=sender.indexOf("eq('status','waiting').contains('evidence',{autonomous_outbound:{needs_readback:true}})");
 const safeExit=sender.indexOf("if(input?.readback_only===true)");
 const composer=sender.indexOf("const composerResponse=await fetch(");
 const send=sender.indexOf("ack=await send(key,acct,to,sub,withOptOutLine(body))");
 assert.ok(entry>=0&&auth>entry&&pending>auth&&safeExit>pending&&composer>safeExit&&send>composer);
 assert.match(sender,/verifiedGmailReadback\(x,messageId,recipient\)/);
 assert.match(sender,/if\(!proof\.ok\)throw\{code:'GMAIL_READBACK_MISMATCH'/);
 assert.match(sender,/external_outreach_executed:false/);
 assert.match(sender,/republish_forbidden:true/);
 assert.match(sender,/powerhouse_email_contact_suppressions/);
 assert.match(sender,/verifyRecipientAuthority/);
 assert.match(sender,/\.eq\('action_id',a\.action_id\)\.eq\('status','waiting'\)/);
});
