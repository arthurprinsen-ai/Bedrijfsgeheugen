import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_ID } from '../supabase/functions/bg-notion-sync/notion-contact-projection.mjs';
import { projectedBatch, pullNotionContacts } from '../supabase/functions/bg-notion-sync/notion-contact-pull.mjs';

const makePage = (id, profile) => ({object:'page',id,last_edited_time:'2026-10-08T12:00:00Z',parent:{type:'data_source_id',data_source_id:CORE_ID},properties:{LinkedIn:{type:'url',url:profile},Contactbeleid:{type:'select',select:{name:'Niet benaderen'}},Kanaal:{type:'select',select:{name:'LinkedIn DM'}},'Tekst goedgekeurd':{type:'checkbox',checkbox:false}}});

test('invalid and duplicate contacts are not treated as send-ready',()=>{
 const x=projectedBatch([makePage('one','https://linkedin.com/in/test-person'),makePage('two','https://linkedin.com/in/test-person/'),makePage('three','https://example.net/in/a')]);
 assert.equal(x.items.length,1);
 assert.equal(x.rejected,1);
 assert.equal(x.items[0].metadata.can_send,false);
});
test('broken cursor must fail rather than incorrectly succeed',async()=>{
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})})};
 await assert.rejects(()=>pullNotionContacts(db,'token',async()=>({results:[],has_more:true,next_cursor:null}),{pages:1}),/CURSOR_INVALID/);
});
test('missing persistent state must prevent an unbounded replay',async()=>{
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:{message:'missing'}})})})})};
 await assert.rejects(()=>pullNotionContacts(db,'token',async()=>{throw Error('never called')}),/CURSOR_READ_FAILED/);
});
