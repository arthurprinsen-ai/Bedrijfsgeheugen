import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sender=readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const map=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('Gmail created response is not independent SENT evidence',()=>{
 assert.match(sender,/GMAIL_SEND_EMAIL/);
 assert.match(sender,/GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID/);
 assert.match(sender,/id!==messageId\|\|!labels\.includes\('SENT'\)/);
 assert.match(sender,/recipient_matches:/);
 assert.match(sender,/provider_readback_verified:true/);
 assert.ok(sender.indexOf('const proof=await readback(')<sender.indexOf('provider_ack_verified:true'));
});

test('provider side effect with unknown completion never auto-retries',()=>{
 assert.match(sender,/COMPOSIO_GMAIL_SEND_UNCERTAIN/);
 assert.match(sender,/SEND_ACK_MESSAGE_ID_MISSING/);
 assert.match(sender,/SEND_OUTCOME_AMBIGUOUS_NO_RESEND/);
 assert.match(sender,/\.eq\('status','waiting'\)\.contains\('evidence',\{autonomous_outbound:\{needs_readback:true\}\}\)/);
 assert.match(sender,/republish_forbidden:true/);
 assert.match(sender,/status:'unverified'/);
 assert.doesNotMatch(sender,/retryable:true\}\},updated_at:now\}\)\.eq\('action_id',a\.action_id\)\.eq\('status','waiting'\)/);
});

test('side effect ID is checkpointed before readback and outcome before done',()=>{
 const ack=sender.indexOf("code:'ACK_CHECKPOINT_WRITEBACK'");
 const settle=sender.indexOf('out.push(await settle(');
 const writeOutcome=sender.indexOf("const{error:oe}=await db.from('powerhouse_sales_outcomes')");
 const writeDone=sender.indexOf("const{data:done,error:we}=await db.from('powerhouse_sales_actions')");
 assert.ok(ack>=0&&settle>ack);
 assert.ok(writeOutcome>=0&&writeDone>writeOutcome);
 assert.match(sender,/onConflict:'dedupe_key'/);
 assert.match(sender,/\.eq\('status','prepared'\)\.select\('action_id'\)/);
});

test('the existing zero-send warning and suppression gate remain intact',()=>{
 assert.match(sender,/NO_ELIGIBLE_PREPARED_EMAIL/);
 assert.match(sender,/NO_PROVIDER_CONFIRMED_EMAIL/);
 assert.match(sender,/status:sent===0\|\|out\.some/);
 assert.match(sender,/CONTACT_SUPPRESSED/);
 assert.match(sender,/HUMAN_MESSAGE_QUALITY_NOT_PROVEN/);
 assert.match(sender,/external_outreach_executed:sent>0/);
 assert.match(map,/COMMERCIAL_OUTBOUND_READBACK_P0_V1/);
});
