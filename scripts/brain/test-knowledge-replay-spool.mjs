import test from 'node:test';
import assert from 'node:assert/strict';
import {createReplaySpool,memoryReplayStore} from '../../brain/knowledge/replay-spool.mjs';

const event={event_id:'uke-1159',dedupe_key:'homepage-video',fingerprint:'homepage-video-v1'};

test('duplicate deferred event creates one open obligation',async()=>{
  const spool=createReplaySpool(memoryReplayStore(),{now:()=> '2026-09-08T11:45:00Z'});
  await spool.defer(event,'MAKE_CAPACITY');
  await spool.defer(event,'MAKE_CAPACITY');
  assert.equal((await spool.listOpen()).length,1);
});

test('written event stays open until BG167 readback',async()=>{
  const spool=createReplaySpool(memoryReplayStore(),{now:()=> '2026-09-08T11:45:00Z'});
  await spool.defer(event,'MAKE_CAPACITY');
  await spool.markWritten(event.dedupe_key,{bg168_ref:'route-1',bg166_ref:'write-1'});
  assert.equal((await spool.listOpen()).length,1);
  await spool.markVerified(event.dedupe_key,'bg167-readback-1');
  assert.equal((await spool.listOpen()).length,0);
});

test('claim is exactly once while obligation is active',async()=>{
  const spool=createReplaySpool(memoryReplayStore(),{now:()=> '2026-09-08T11:45:00Z'});
  await spool.defer(event,'MAKE_CAPACITY');
  assert.equal((await spool.claim(event.dedupe_key)).claimed,true);
  assert.equal((await spool.claim(event.dedupe_key)).claimed,false);
});
