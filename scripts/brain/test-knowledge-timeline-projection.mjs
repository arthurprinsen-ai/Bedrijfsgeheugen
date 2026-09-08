import test from 'node:test';
import assert from 'node:assert/strict';
import {buildKnowledgeTimeline} from '../../brain/knowledge/timeline-projection.mjs';

const common={correlation_id:'homepage-video-1159',component:'website:homepage-hero-video',fingerprint:'homepage-hero-video-autoplay-lifecycle-recovery-v1',outcome:{status:'success'},readback:{state:'verified',bg167_ref:'readback-1'}};
const chat={...common,event_id:'chat',captured_at:'2026-09-08T09:00:00Z',source_type:'chat',source_refs:[{system:'chatgpt',kind:'chat_session',id:'homepage-video-chat'}]};
const pr={...common,event_id:'pr',captured_at:'2026-09-08T09:10:00Z',source_type:'github',source_refs:[{system:'github',kind:'pull_request',id:'1159'}]};
const merge={...common,event_id:'merge',captured_at:'2026-09-08T10:30:00Z',source_type:'github',source_refs:[{system:'github',kind:'merge_commit',id:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5'}]};
const deploy={...common,event_id:'deploy',captured_at:'2026-09-08T10:37:11Z',source_type:'netlify',source_refs:[{system:'netlify',kind:'production_deploy',id:'6a9fe513a7af0e0008661320',deploy_id:'6a9fe513a7af0e0008661320'}]};
const learning={...common,event_id:'learning',captured_at:'2026-09-08T10:40:00Z',source_type:'agent',source_refs:[{system:'brain',kind:'learning',id:'homepage-hero-video-autoplay-lifecycle-recovery-v1'}]};

test('reconstructs homepage video as one newest-first material chain',()=>{
  const timeline=buildKnowledgeTimeline([chat,pr,merge,deploy,learning]);
  assert.equal(timeline.length,1);
  assert.equal(timeline[0].chain.includes('6a9fe513a7af0e0008661320'),true);
  assert.equal(timeline[0].sourceRefs.some(x=>x.id==='1159'),true);
  assert.equal(timeline[0].events[0].event_id,'learning');
});

test('filters by component source type and outcome',()=>{
  assert.equal(buildKnowledgeTimeline([chat,pr],{sourceType:'github'}).length,1);
  assert.equal(buildKnowledgeTimeline([chat,pr],{component:'other'}).length,0);
  assert.equal(buildKnowledgeTimeline([chat,pr],{outcomeStatus:'failed'}).length,0);
});
