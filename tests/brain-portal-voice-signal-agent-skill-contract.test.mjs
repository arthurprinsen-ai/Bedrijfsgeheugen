import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const get=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('original portal skill includes consent, missing-value evidence and authentic release gate',async()=>{
  const skill=await get('.agents/skills/portal-living-interface/SKILL.md');
  for(const term of ['portal-v2-voice-signal-advisor-v1','microfoon','24/7','portal.signalering','portal.tasks.items','readback']) {
    assert.ok(skill.includes(term),term);
  }
  assert.match(skill,/geen.*(?:scheduler|databank)/i);
  assert.match(skill,/geen.*(?:0|benchmark).*(?:onbekend|bronfeit)/i);
});
test('Powerhouse intelligence skill retains one Brain-Heartbeat loop and explicit owner actions',async()=>{
  const skill=await get('.agents/skills/powerhouse-company-intelligence-os/SKILL.md');
  assert.match(skill,/portal-v2-voice-signal-advisor-v1/);
  assert.match(skill,/ONE BRAIN/);
  assert.match(skill,/Heartbeat/);
  assert.match(skill,/eigenaar en deadline/);
  assert.match(skill,/niet 24\/7-live/);
});
test('existing UX, security and data-quality agents own safe signals without another agent',async()=>{
  const team=await get('platform/agents/agent-team.mjs');
  for(const required of ['verify-portal-voice-explicit-consent-typed-fallback-focus-and-screenreader-access',
    'verify-portal-voice-microphone-opt-in-no-sensitive-dictation-and-account-switch-stop',
    'reject-portal-signal-threshold-alert-when-tenant-kpi-missing-stale-unknown-or-demo',
    'verify-tenant-only-alert-and-task-readback-with-no-unauthorized-provider-action'])
    assert.ok(team.includes("'"+required+"'"),required);
  assert.match(team,/ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS/);
});
