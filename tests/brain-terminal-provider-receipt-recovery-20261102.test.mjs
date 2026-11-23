import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readbacksForFunctions,verifyLiveProviderReadbacks} from '../tools/supabase/publish-edge-provider-readback.mjs';
const read=p=>readFileSync(p,'utf8');
const fn='portal-state-eu', sha='a'.repeat(64),other='b'.repeat(64);
const receipt=(version=593,hash=sha)=>({function:fn,version,runtime_sha256:hash,state:'ACTIVE'});
const provider=(version=594,hash=sha,status='ACTIVE')=>[{slug:fn,version,ezbr_sha256:hash,status,updated_at:2}];
test('live provider metadata remains a hard gate on newer version even if source may match',()=>{
 assert.throws(()=>verifyLiveProviderReadbacks([receipt(593)],provider(594)),/SUPABASE_PROVIDER_LIVE_MISMATCH:portal-state-eu/);
 assert.throws(()=>verifyLiveProviderReadbacks([receipt(594)],provider(594,other)),/SUPABASE_PROVIDER_LIVE_MISMATCH:portal-state-eu/);
 assert.throws(()=>readbacksForFunctions(provider(594,sha,'INACTIVE'),[fn]),/SUPABASE_PROVIDER_FUNCTION_NOT_ACTIVE/);
 assert.deepEqual(verifyLiveProviderReadbacks([receipt(594)],provider(594)),[receipt(594)]);
});
test('original terminal emits actionable mismatch classification but still fails instead of overriding status',()=>{
 const wf=read('.github/workflows/obligation-terminal-closure.yml');
 assert.match(wf,/TERMINAL_SOURCE_PARITY_RECHECK_REQUIRED/);
 assert.match(wf,/expected_version=/);
 assert.match(wf,/active_version=/);
 assert.match(wf,/SUPABASE_PROVIDER_LIVE_MISMATCH/);
 assert.match(wf,/throw new Error\('SUPABASE_PROVIDER_LIVE_MISMATCH:'/);
 assert.doesNotMatch(wf,/acceptStaleReceipt|forceGreenOnMismatch/);
});
test('original existing release skill requires actual main-byte parity and same terminal gate rerun',()=>{
 const skill=read('.agents/skills/merge-capability-guard/SKILL.md');
 assert.match(skill,/20 bronbestanden/);
 assert.match(skill,/byte-for-byte/);
 assert.match(skill,/dezelfde oorspronkelijke terminalcheck/);
 assert.match(skill,/geen extra deploy\/parallel executor/);
});
