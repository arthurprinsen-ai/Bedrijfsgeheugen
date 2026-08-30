import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverBrainMembership } from '../tools/brain-delivery-system.mjs';

const platforms=[
  {platform:'github',status:'active'},
  {platform:'netlify',status:'active'},
  {platform:'make',status:'active'},
  {platform:'notion',status:'active'},
  {platform:'supabase',status:'active'},
  {platform:'dataforseo',status:'active'}
];

test('agents workflows and platforms inherit continuous delivery automatically',()=>{
  const rows=discoverBrainMembership({
    registeredComponents:[{key:'BG169',status:'active'}],
    agents:[{id:'agent-new-builder'}],
    workflows:['.github/workflows/new-builder.yml'],
    platforms
  });
  assert.equal(rows.every(row=>row.continuousDelivery===true),true);
  assert.deepEqual(rows.filter(row=>row.kind==='PLATFORM').map(row=>row.componentKey),[
    'platform:dataforseo','platform:github','platform:make','platform:netlify','platform:notion','platform:supabase'
  ]);
});

test('platform membership is production governed like every other Brain member',()=>{
  const rows=discoverBrainMembership({platforms});
  for(const row of rows){
    assert.equal(row.brainContractVersion,'brain.v1');
    assert.equal(row.sharedContextRequired,true);
    assert.equal(row.outcomeWritebackRequired,true);
    assert.equal(row.costManaged,true);
    assert.equal(row.securityGoverned,true);
    assert.equal(row.productionAuthority,'BG169');
  }
});
