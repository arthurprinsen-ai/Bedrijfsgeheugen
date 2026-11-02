import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSafetyCompass} from '../portal-v2/modules/security-trust-workspace.js';

const read=(path)=>readFileSync(path,'utf8');

test('the canonical Security Agent has bounded provider failure and negative access recovery',()=>{
  const roster=read('platform/agents/agent-team.mjs');
  for(const required of [
    'escalate-unsupported-provider-access-control-without-retry-loop',
    'trace-privileged-external-callers-before-grant-change',
    'verify-denied-anonymous-access-after-provider-protection',
    'provider-configuration-owner-escalation',
    'dependency-first-privileged-rpc-hardening',
    'negative-access-proof-before-resolved'
  ])assert.ok(roster.includes(required),required);
  assert.equal((roster.match(/id:'agent-security'/g)||[]).length,1);
});

test('the original skill preserves fail-closed recovery and source ownership',()=>{
  const skill=read('.agents/skills/powerhouse-security-trust-center/SKILL.md');
  assert.match(skill,/Provider-remediation failure closure/);
  assert.match(skill,/422/);
  assert.match(skill,/anonymous negative access test/i);
  assert.match(skill,/positive original-caller smoke proof/i);
  assert.match(skill,/never retried indefinitely/i);
  assert.match(skill,/No second scheduled agent/i);
  assert.match(skill,/PROVEN.*actual original fix/i);
});

test('the learning is security-sensitive, replayed in all lanes and does not claim production resolution',()=>{
  const learning=JSON.parse(read('brain/learning/2026-11-02-security-provider-remediation-v1.json'));
  assert.equal(learning.compiler.security_sensitive,true);
  assert.equal(learning.compiler.machine_enforceable,true);
  assert.match(learning.proof_state,/CANDIDATE/);
  for(const lane of ['historical_replay','shadow','canary'])assert.deepEqual(learning.evaluation[lane],['tests/brain-security-provider-remediation-v1.test.mjs']);
  assert.ok(learning.prevention_rules.some(rule=>/negative|denial|anonymous/i.test(rule)));
});

test('a fully evidenced compass must remain not-green with an archived access failure or privileged warning',()=>{
  const at=Date.parse('2026-11-02T16:00:00Z');
  const observed_at='2026-11-02T15:00:00Z',expires_at='2026-11-03T15:00:00Z';
  const snap='2026-11-02T15:30:00Z';
  const summary={postureStatus:'VERIFIED_NO_OPEN_FINDINGS',evidenceCoverage:100};
  const factory=()=>buildSafetyCompass(summary,[],snap,[],at).areas.flatMap(area=>area.checks.map(([provider_key,control_key])=>({provider_key,control_key,status:'PASS',evidence_available:true,observed_at,expires_at})));
  const all=factory();
  assert.equal(buildSafetyCompass(summary,all,snap,[],at).overall,'VERIFIED_NO_OPEN_FINDINGS');
  const archive=factory();archive.find(row=>row.control_key==='ARCHIVE_PREVIEW_ACCESS').status='FAIL';
  assert.equal(buildSafetyCompass(summary,archive,snap,[],at).overall,'ACTION_REQUIRED');
  const privileged=factory();privileged.find(row=>row.control_key==='PRIVILEGED_FUNCTIONS').status='WARN';
  assert.notEqual(buildSafetyCompass(summary,privileged,snap,[],at).overall,'VERIFIED_NO_OPEN_FINDINGS');
});
