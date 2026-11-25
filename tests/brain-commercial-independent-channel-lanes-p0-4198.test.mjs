import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

function declaredDeliveryLanes(){
  const start=loop.indexOf('    const deliveryLanes=[');
  const end=loop.indexOf('    ] as const;',start);
  assert.ok(start>0 && end>start,'delivery lanes must be explicitly enumerated');
  const source=loop.slice(start,end+'    ] as const;'.length)
    .replace('as const;',';');
  return Function('runDate',source+'\nreturn deliveryLanes;')('2026-10-11');
}

test('publication, blog and engagement have separate invocations and channel scopes',()=>{
  const lanes=declaredDeliveryLanes();
  const names=lanes.map(([id])=>id);
  assert.deepEqual(names,['linkedin_personal','linkedin_company','instagram_company','blog','linkedin_engagement']);
  for(const [id,fn,payload] of lanes){
    assert.equal(payload.runDate,'2026-10-11');
    if(id==='blog')assert.equal(fn,'powerhouse-blog-queue');
    if(id==='linkedin_engagement')assert.equal(payload.mode,'cockpit_autopilot');
    if(['linkedin_personal','linkedin_company','instagram_company'].includes(id)){
      assert.equal(fn,'powerhouse-social-publisher');
      assert.equal(payload.mode,'publish_only');
      assert.deepEqual(payload.channels,[id]);
    }
  }
  assert.match(publisher,/const requestedChannels = Array\.isArray\(body\.channels\)/);
  assert.match(publisher,/\.in\('channel', channels\)/);
  assert.match(loop,/Promise\.all\(deliveryLanes\.map/);
});

test('a failed Instagram provider returns independently while other lanes finish',async()=>{
  const lanes=declaredDeliveryLanes();
  const seen=[];
  const invoke=async(id)=>{
    seen.push(id);
    if(id==='instagram_company')return {ok:false,error:'MEDIA_PROOF_REQUIRED'};
    return {ok:true};
  };
  const results=await Promise.all(lanes.map(async([id])=>({channel:id,...await invoke(id)})));
  assert.equal(results.length,5);
  assert.deepEqual(seen,lanes.map(([id])=>id));
  assert.equal(results.find(x=>x.channel==='instagram_company').ok,false);
  assert.ok(results.filter(x=>x.channel!=='instagram_company').every(x=>x.ok));
});

test('generation is isolated by exact target and never re-plans other channels',()=>{
  assert.match(loop,/Promise\.all\(pendingChannels\.map/);
  assert.match(loop,/\{runDate,channel\}/);
  assert.match(orchestrator,/if\(channelScope && !allowedChannelScopes\.has\(channelScope\)\)/);
  assert.match(orchestrator,/for \(const channel of \(channelScope \? \[\] : CHANNELS\)\)/);
  assert.match(orchestrator,/channelScope \? pendingQuery\.eq\('channel',channelScope\) : pendingQuery/);
  assert.match(orchestrator,/if\(!channelScope\)\{/);
  assert.match(orchestrator,/SOURCE_BACKED_CHANNEL_MATERIALIZATION_FAILED/);
});

test('one canonical lease and all publication safety gates remain in place',()=>{
  assert.match(loop,/claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(loop,/releaseLoopLease\(runDate, leaseHolder\)/);
  assert.match(loop,/x-powerhouse-token/);
  assert.match(publisher,/publication_authority/);
  assert.match(publisher,/GLOBAL_POST_DUPLICATE_BLOCKED/);
  assert.match(publisher,/MIRA_CANONICAL_MASTER_FACE_NOT_VERIFIED/);
  assert.match(publisher,/PERSONAL_SOURCE_UNVERIFIED/);
  assert.match(loop,/GREEN MEANS PROVIDER SIDE-EFFECT OR OUTCOME VERIFIED/);
  assert.doesNotMatch(loop,/cron\.schedule|setInterval|setTimeout/);
});
