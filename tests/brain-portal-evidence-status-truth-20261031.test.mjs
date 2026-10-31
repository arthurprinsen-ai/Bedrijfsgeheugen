import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classifyPowerhouseTone as tone} from '../portal-v2/modules/powerhouse-status-tone.mjs';

test('original Heartbeat 15-loop RED/AMBER/GREEN states retain their visual severity',()=>{
  assert.equal(tone('RED'), 'bad');
  assert.equal(tone('RED/RECOVERY_DUE'), 'bad');
  assert.equal(tone('AMBER'), 'warn');
  assert.equal(tone('AMBER_EVIDENCE_DUE'), 'warn');
  assert.equal(tone('GREEN'), 'good');
  assert.equal(tone('UNKNOWN'), 'neutral');
});
test('negative evidence state never becomes green by substring match',()=>{
  for(const status of [
    'UNVERIFIED','NOT_VERIFIED','NOT_LIVE','NOT_PROVEN','UNPROVEN',
    'UNFULFILLED','UNSUCCESSFUL','GREEN_NOT_VERIFIED','SUCCESS_NOT_PROVEN',
    'PENDING_PROOF','MISSING_PROVIDER_PROOF','OPEN_NO_PROVEN_ACTION'
  ]){
    assert.notEqual(tone(status),'good',status);
  }
  assert.equal(tone('NOT_REQUIRED'),'neutral');
});
test('critical severity and failed provider evidence outrank optimistic labels',()=>{
  assert.equal(tone('GREEN','critical'),'bad');
  assert.equal(tone('VERIFIED','error'),'bad');
  assert.equal(tone('LIVE_PROVEN','red'),'bad');
  assert.equal(tone('READY','warning'),'warn');
  assert.equal(tone('DEGRADED_NO_CURRENT_DAILY_ACTION_SET'),'bad');
  assert.equal(tone('REVOKED_ACCESS_TOKEN'),'bad');
  assert.equal(tone('PROVIDER_VERIFIED'),'good');
  assert.equal(tone('LIVE_PROVEN'),'good');
});
test('single original Portal V2 projection powers badges, error counts and status filtering',async()=>{
  const portal=await readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8');
  assert.match(portal,/import \{ classifyPowerhouseTone as tone \} from '\.\/powerhouse-status-tone\.mjs'/);
  assert.match(portal,/function isError\(event\)\{return tone\(event\.status,event\.severity\)==='bad'/);
  assert.match(portal,/const errors=events\.filter\(isError\)/);
  assert.match(portal,/tone\(e\.status,e\.severity\)/);
  assert.match(portal,/function statusBadge\(event\)\{const t=tone\(event\.status,event\.severity\)/);
  assert.doesNotMatch(portal,/function tone\(status,severity\)/);
  // No new publisher, scheduler or modified publication/realized-revenue logic.
  assert.match(portal,/function oneLoopAssuranceView\(assurance\)/);
});
