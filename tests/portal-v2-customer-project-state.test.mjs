import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalStateHandler } from '../platform/api/portal-state-handler.mjs';
import { createPortalStateClient } from '../portal-v2/portal-state.js';

const customerRecord={
  sourceUpdatedAt:'2026-09-11T16:00:00.000Z',
  data:{
    company:{name:'IJsselmonde'},
    portal:{
      access:{allowedEmails:['arthur@bedrijfsgeheugen.nl','tom@example.nl']},
      offer:{number:'OF-IJS-001',amount:20000}
    }
  }
};

test('customer route reads the secure customer projection only for an allowed identity email',async()=>{
  const reads=[];
  const store={
    async get(tenantId){reads.push(tenantId);return tenantId==='customer:ijsselmonde'?customerRecord:null;},
    async put(){throw new Error('not used');}
  };
  const handler=createPortalStateHandler({
    getUser:async()=>({id:'u-1',email:'ARTHUR@bedrijfsgeheugen.nl',name:'Arthur'}),
    store,
    env:{}
  });
  const response=await handler(new Request('https://example.test/api/portal-state?customer=ijsselmonde'));
  assert.equal(response.status,200);
  assert.deepEqual(reads,['customer:ijsselmonde']);
  const body=await response.json();
  assert.equal(body.company.name,'IJsselmonde');
  assert.equal(body.portal.offer.number,'OF-IJS-001');
});

test('customer route denies a signed-in identity that is not on the customer allow-list',async()=>{
  const store={get:async()=>customerRecord,put:async()=>({stored:true})};
  const handler=createPortalStateHandler({
    getUser:async()=>({id:'u-2',email:'outsider@example.nl'}),
    store,
    env:{}
  });
  const response=await handler(new Request('https://example.test/api/portal-state?customer=ijsselmonde'));
  assert.equal(response.status,403);
  assert.deepEqual(await response.json(),{error:'FORBIDDEN'});
});

test('Portal V2 client requests the customer-scoped API for /portaal/ijsselmonde',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify({company:{name:'IJsselmonde'}}),{status:200,headers:{'content-type':'application/json'}});};
  const user={jwt:async()=>'signed-token'};
  const client=createPortalStateClient({
    fetchImpl,
    identityProvider:()=>({currentUser:()=>user}),
    demoMode:false,
    customerSlug:'ijsselmonde'
  });
  await client.load();
  assert.equal(calls[0][0],'/api/portal-state?customer=ijsselmonde');
  assert.equal(calls[0][1].headers.authorization,'Bearer signed-token');
});
