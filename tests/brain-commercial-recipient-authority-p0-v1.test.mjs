import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const map=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
const contract=source.match(/async function verifyRecipientAuthority\(db:any,a:any,to:string\):Promise<boolean>\{[\s\S]*?\n\}/)?.[0];
assert.ok(contract,'CRM permission guard must exist as a bounded pure DB-check function');
const js=contract.replace('db:any,a:any,to:string):Promise<boolean>','db,a,to)');
const verify=new Function('s',js+'\nreturn verifyRecipientAuthority;')((v)=>String(v??'').trim());

function fakeDb(rows=[],error=null){
 let queried=false;
 const db={from(t){assert.equal(t,'bg_connecties');return{select(cols){
  assert.equal(cols,'sleutel,linkedin_url,extra');return{eq(field,email){
   assert.equal(field,'email');assert.equal(email,'a@example.org');queried=true;
   return{limit(n){assert.equal(n,10);return Promise.resolve({data:rows,error})}};
  }};
 }};}};
 return{db,wasQueried:()=>queried};
}

test('sender refuses unapproved CRM contact even if prepared action says human approved',async()=>{
 const action={person_key:'person-1',evidence:{recipient_email:'a@example.org',human_approved:true}};
 const {db,wasQueried}=fakeDb([{sleutel:'person-1',extra:{verbonden_op:'2026-01-01'}}]);
 assert.equal(await verify(db,action,'a@example.org'),false);
 assert.equal(wasQueried(),true);
});

test('sender requires same recipient, same CRM person and double affirmative approval',async()=>{
 const approved={person_key:'person-1',evidence:{recipient_email:'a@example.org',human_approved:true}};
 const row={sleutel:'person-1',extra:{human_approved:true}};
 assert.equal(await verify(fakeDb([row]).db,approved,'a@example.org'),true);
 assert.equal(await verify(fakeDb([row]).db,{...approved,evidence:{...approved.evidence,human_approved:false}},'a@example.org'),false);
 assert.equal(await verify(fakeDb([{...row,sleutel:'different-person'}]).db,approved,'a@example.org'),false);
 assert.equal(await verify(fakeDb([row]).db,approved,'other@example.org'),false);
});

test('CRM read failures fail closed, never silently imply permission',async()=>{
 const a={person_key:'person-1',evidence:{recipient_email:'a@example.org',human_approved:true}};
 await assert.rejects(verify(fakeDb([],{message:'database unavailable'}).db,a,'a@example.org'),(e)=>e?.code==='RECIPIENT_AUTHORITY_READ');
});

test('dry-run cannot call composer, send or mutate the message plan',()=>{
 const preview=source.indexOf('if(input?.dry_run===true){');
 const composer=source.indexOf("composerResponse=await fetch");
 const planner=source.indexOf("db.rpc('powerhouse_refresh_message_plans_v1'");
 assert.ok(preview>0&&composer>preview&&planner>preview);
 assert.match(source,/recipient_authority_unverified:/);
 assert.match(source,/external_outreach_executed:false/);
});

test('authority gate precedes suppression/claim/provider side effect and persists typed hold',()=>{
 const guard=source.indexOf('const recipientApproved=await verifyRecipientAuthority(db,a,to)');
 const suppression=source.indexOf("db.from('powerhouse_email_contact_suppressions')");
 const claim=source.indexOf("const{data:claim,error:ce}");
 const send=source.indexOf('ack=await send(key,acct,to,sub,body)');
 assert.ok(guard>0&&guard<suppression&&suppression<claim&&claim<send);
 assert.match(source,/RECIPIENT_AUTHORITY_UNVERIFIED/);
 assert.match(source,/owner:'contact-permission-verification'/);
 assert.match(source,/\.eq\('status','prepared'\)/);
 assert.match(source,/GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID/);
 assert.match(source,/SEND_OUTCOME_AMBIGUOUS_NO_RESEND/);
 assert.match(map,/COMMERCIAL_RECIPIENT_AUTHORITY_P0_V1/);
});
