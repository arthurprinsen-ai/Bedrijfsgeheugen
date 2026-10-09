import test from 'node:test';
import assert from 'node:assert/strict';
import {savePortalBusinessInput} from '../portal-v2/business-input-store.js';
import {createPortalStateClient} from '../portal-v2/portal-state.js';

const confirmation=Object.freeze({
  stored:true,stale:false,authorityStored:true,
  powerhouseFeedStored:true,organismImpactStored:true
});
const reply=(body,status=200)=>({
  ok:status>=200&&status<300,
  status,
  async json(){return body;}
});
const identity=()=>({currentUser:()=>({id:'real-auth-shaped-fixture',jwt:async()=> 'test-jwt'})});

test('canonical BusinessInput must require affirmative server, Brain and impact ACK before successful return',async()=>{
  const seen=[];
  const result=await savePortalBusinessInput({inputType:'PortalDomainStateSnapshot',answers:{portal:{profile:{employees:1}}}},{
    authorization:'Bearer test-jwt',
    fetchFn:async(url,options)=>{seen.push({url,options});return reply(confirmation);}
  });
  assert.deepEqual(result,confirmation);
  assert.deepEqual(seen.map(x=>x.url),['/api/portal-business-input']);
  assert.match(seen[0].options.headers.authorization,/^Bearer /);
});

for(const [caseName,ack] of [
  ['uncommitted',{...confirmation,stored:false}],
  ['stale',{...confirmation,stale:true}],
  ['missing authority',{...confirmation,authorityStored:false}],
  ['missing Brain feed',{...confirmation,powerhouseFeedStored:false}],
  ['missing impact',{...confirmation,organismImpactStored:false}],
  ['missing flags',{stored:true,authorityStored:true}],
  ['empty body',{}]
]){
  test('canonical incomplete HTTP 200: '+caseName+' blocks dependent portal projection',async()=>{
    const calls=[];
    const client=createPortalStateClient({identityProvider:identity,fetchImpl:async(url)=>{
      calls.push(url);
      if(url==='/api/portal-business-input')return reply(ack);
      throw new Error('dependent projection must not be written');
    }});
    await assert.rejects(()=>client.write({portal:{profile:{employees:2}}}),/PORTAL_BUSINESS_INPUT_ACK_INCOMPLETE/);
    assert.deepEqual(calls,['/api/portal-business-input']);
  });
}

test('a failed HTTP response remains fail-closed with existing server error',async()=>{
  await assert.rejects(()=>savePortalBusinessInput({answers:{}},{
    authorization:'Bearer test-jwt',
    fetchFn:async()=>reply({error:'POWERHOUSE_FEED_WRITE_FAILED'},502)
  }),/POWERHOUSE_FEED_WRITE_FAILED/);
});
