import {createOperatingLoopHandler} from '../../platform/api/brain-operating-loop-handler.mjs';
const calls=[];const store={async append(input){calls.push(input);return {duplicate:false,record:input};},async getProjection(tenantId){return {tenantId,records:[],state:{stages:{}},advice:[]};}};
const getUser=async request=>request.headers.get('x-test-user')?{id:'u1',app_metadata:{tenantId:'tenant-a'}}:null;const handler=createOperatingLoopHandler({getUser,store});
if((await handler(new Request('https://x/api/brain-operating-loop'))).status!==401) throw new Error('auth fail-open');
const getRes=await handler(new Request('https://x/api/brain-operating-loop',{headers:{'x-test-user':'1'}}));if(getRes.status!==200||(await getRes.json()).tenantId!=='tenant-a') throw new Error('tenant projection failed');
const post=await handler(new Request('https://x/api/brain-operating-loop',{method:'POST',headers:{'content-type':'application/json','x-test-user':'1'},body:JSON.stringify({tenantId:'evil',type:'Evidence',id:'e1',idempotencyKey:'k1',source:'seo'})}));if(post.status!==201||calls[0].tenantId!=='tenant-a') throw new Error('client tenant override accepted');
if((await handler(new Request('https://x/api/brain-operating-loop',{method:'PUT',headers:{'x-test-user':'1'}}))).status!==405) throw new Error('method fail-open');
console.log('operating loop handler tests passed');
