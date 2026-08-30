import {createOperatingLoopHandler} from '../../platform/api/brain-operating-loop-handler.mjs';

const calls=[];
const store={
  async append(input){calls.push(input);return {duplicate:false,record:input};},
  async getProjection(tenantId){return {tenantId,records:[],state:{stages:{}},advice:[]};}
};
const getUser=async request=>request.headers.get('x-test-user')?{id:'u1',app_metadata:{tenant_id:'tenant-a'}}:null;
const handler=createOperatingLoopHandler({getUser,store});

const unauth=await handler(new Request('https://example.test/api/brain-operating-loop'));
if(unauth.status!==401) throw new Error('unauthenticated access must be rejected');

const getRes=await handler(new Request('https://example.test/api/brain-operating-loop',{headers:{'x-test-user':'1'}}));
if(getRes.status!==200) throw new Error('authenticated projection read must succeed');
const getBody=await getRes.json();
if(getBody.tenantId!=='tenant-a') throw new Error('tenant must come from authenticated server identity');

const postRes=await handler(new Request('https://example.test/api/brain-operating-loop',{method:'POST',headers:{'content-type':'application/json','x-test-user':'1'},body:JSON.stringify({tenantId:'evil',type:'Evidence',id:'e1',idempotencyKey:'k1',source:'seo',subjectId:'market:seo'})}));
if(postRes.status!==201) throw new Error('valid append must succeed');
if(calls[0].tenantId!=='tenant-a') throw new Error('client tenantId must never override authenticated tenant');

const bad=await handler(new Request('https://example.test/api/brain-operating-loop',{method:'PUT',headers:{'x-test-user':'1'}}));
if(bad.status!==405) throw new Error('unsupported method must fail closed');

console.log('operating loop handler tests passed');
