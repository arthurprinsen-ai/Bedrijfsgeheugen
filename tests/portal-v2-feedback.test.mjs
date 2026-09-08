import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalFeedbackHandler} from '../platform/api/portal-feedback-handler.mjs';

function handler({user=null,store,now=()=>new Date().toISOString(),uuid=()=> 'fb-test'}={}){
 return createPortalFeedbackHandler({getUser:async()=>user,store:store||{setJSON:async()=>({modified:true})},now,uuid});
}

test('portal feedback denies anonymous requests before persistence',async()=>{
 let touched=false;
 const response=await handler({store:{setJSON:async()=>{touched=true}}})(new Request('https://example.test/api/portal-feedback',{method:'POST',body:JSON.stringify({text:'test'})}));
 assert.equal(response.status,401);assert.equal(touched,false);
});

test('portal feedback derives tenant only from verified identity and stores bounded context',async()=>{
 let saved=null;
 const user={id:'u-1',app_metadata:{tenantId:'tenant-secure'}};
 const response=await handler({user,store:{setJSON:async(key,value)=>{saved={key,value};return{modified:true}}},now:()=> '2026-09-08T19:00:00.000Z',uuid:()=> 'fb-1'})(new Request('https://example.test/api/portal-feedback?tenantId=evil',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'  Goed portaal  ',context:{page:'roadmap',tenantId:'evil'}})}));
 assert.equal(response.status,201);
 assert.match(saved.key,/^tenant-secure\//);
 assert.equal(saved.value.tenantId,'tenant-secure');
 assert.equal(saved.value.text,'Goed portaal');
 assert.deepEqual(saved.value.context,{page:'roadmap'});
 assert.doesNotMatch(saved.key,/evil/);
});

test('portal feedback rejects oversized feedback',async()=>{
 const response=await handler({user:{id:'u-1'}})(new Request('https://example.test/api/portal-feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'x'.repeat(2001)})}));
 assert.equal(response.status,413);
});
