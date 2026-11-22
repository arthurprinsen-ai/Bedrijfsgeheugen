import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const voicePath=new URL('../portal-v2/voice-signals.js',import.meta.url);
const skillPath=new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url);
const read=()=>readFile(voicePath,'utf8');

test('historical: old assistant reply and error are rejected after identity or dialog change',async()=>{
  const voice=await read();
  assert.match(voice,/const requestEpoch=\+\+assistantEpoch/);
  assert.ok(voice.includes("const owner=String(authenticated()?.user?.id||'')"),'request must capture verified current tenant principal');
  assert.ok(voice.includes("requestEpoch!==assistantEpoch||String(authenticated()?.user?.id||'')!==owner||!dialog.open"),
    'successful response must check request, tenant, and open dialog after await');
  assert.ok(voice.includes("requestEpoch===assistantEpoch&&String(authenticated()?.user?.id||'')===owner&&dialog.open"),
    'error path must not display prior tenant context');
});

test('shadow: speech callbacks are bound to original recognizer, tenant and active modal',async()=>{
  const voice=await read();
  assert.ok(voice.includes('voiceEpoch++'),'abort must invalidate asynchronous results');
  assert.ok(voice.includes('recognizer===r&&voiceRequestEpoch===voiceEpoch'),'old recognizer never owns a new session');
  assert.ok(voice.includes("voiceOwner===String(authenticated()?.user?.id||'')&&dialog.open"),'speech must remain same tenant, visible window');
  assert.match(voice,/r\.onresult=event=>\{\s*if\(!voiceStillCurrent\(\)\)return;/);
  assert.match(voice,/r\.onerror=event=>\{\s*if\(voiceStillCurrent\(\)\)note/);
});

test('canary: account switch, logout, close and dispose invalidate all pending replies',async()=>{
  const voice=await read(),skill=await readFile(skillPath,'utf8');
  assert.ok(voice.includes("dialog.addEventListener('close',()=>{assistantEpoch++;"));
  assert.ok(voice.includes('if(next!==principal){principal=next;proofEpoch++;connectorEpoch++;assistantEpoch++;'));
  assert.ok(voice.includes('const boundary=()=>{proofEpoch++;connectorEpoch++;assistantEpoch++;'));
  assert.ok(voice.includes('destroy(){assistantEpoch++;'));
  assert.match(skill,/vertraagde spraak-\/assistentantwoorden/);
  assert.doesNotMatch(voice,/Notification\.requestPermission|new Worker|setInterval/);
});
