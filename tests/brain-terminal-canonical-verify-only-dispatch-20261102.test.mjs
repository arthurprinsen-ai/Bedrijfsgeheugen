import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const terminal=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
const brain=readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');

test('same original terminal dispatches missing exact-head BRAIN read-only verification after merge',()=>{
  assert.match(terminal,/pull_request:\s*\n\s*branches: \[main\]\s*\n\s*types: \[closed\]/);
  assert.match(terminal,/actions: write/);
  assert.match(terminal,/name: Ensure original exact-head read-only BRAIN verification exists/);
  assert.match(terminal,/BRAIN_DISPATCH_PR_NOT_MERGED/);
  assert.match(terminal,/BRAIN_DISPATCH_EXACT_IDENTITY_MISMATCH/);
  assert.match(terminal,/BRAIN_DISPATCH_FOREIGN_REPO/);
  assert.match(terminal,/BRAIN_DISPATCH_MERGE_NOT_ON_PROTECTED_MAIN/);
  assert.match(terminal,/unified-brain-delivery\.yml\/dispatches/);
  assert.match(terminal,/verification_only:"true"/);
  assert.match(terminal,/BRAIN_EXACT_VERIFICATION_ALREADY_REQUESTED/);
  assert.ok(terminal.indexOf('name: Ensure original exact-head read-only BRAIN verification exists')<
    terminal.indexOf('name: Verify exact-head critical delivery gates before terminal claim'));
});

test('still requires real successful BRAIN exact candidate and protected main source',()=>{
  assert.match(terminal,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.match(terminal,/TERMINAL_CRITICAL_GATE_NOT_TERMINAL/);
  assert.match(terminal,/TERMINAL_CRITICAL_GATE_FAILED/);
  assert.match(terminal,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.match(terminal,/\.display_title==\$title/);
  assert.match(brain,/MERGED_CANDIDATE_READ_ONLY_VERIFIED/);
  assert.match(brain,/verification_only != true/);
  assert.match(brain,/BG169 GitHub-native production transport/);
  assert.doesNotMatch(terminal,/continue-on-error:\s*true/);
  assert.doesNotMatch(terminal,/recovery_succeeded_without_brain|BRAIN_FAKE_SUCCESS/);
});

test('read-only verification cannot schedule duplicate publisher, skip source or claim commerce',()=>{
  const policy=readFileSync('AGENTS.md','utf8');
  assert.match(policy,/P0_20261101_LINKEDIN_BUYER_FIRST_EDITORIAL_INVARIANT_V1/);
  assert.doesNotMatch(terminal,/schedule:/);
  assert.doesNotMatch(terminal,/Make\.com|Buffer.*publish/);
  assert.doesNotMatch(terminal,/curl .*powerhouse-social-publisher/);
});

test('admin Portal shows original BRAIN incident from source without fabricating terminal outcome',()=>{
  const source=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
  const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
  assert.match(source,/terminalBrainIncident:datasets\[27\]/);
  assert.match(source,/fingerprint=eq\./);
  assert.match(ui,/data-original-brain-terminal-incident/);
  assert.match(ui,/Oorspronkelijke mislukte controle/);
  assert.match(ui,/href="https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/actions\/runs\/41350194932"/);
  const observed=projectOtherData({
    terminalBrainIncident:[{
      fingerprint:'powerhouse|terminal|exact-head-unified-brain-run-missing|20261029-v1',
      maturity:'VALIDATED',occurrence_count:2,
      root_cause:'No original exact-head BRAIN dispatch recorded',
      last_seen_at:'2026-11-01T21:29:40Z'
    }],
    readStates:{terminalBrainIncident:'LIVE'}
  });
  assert.equal(observed.terminalBrainRecovery.status,'RECOVERY_EVIDENCE_DUE');
  assert.equal(observed.terminalBrainRecovery.maturity,'VALIDATED');
  assert.equal(observed.terminalBrainRecovery.occurrenceCount,2);
  assert.equal(observed.terminalBrainRecovery.terminalWorkflowIndependentlyVerified,false);
  assert.equal(observed.terminalBrainRecovery.customerOrdersAttributed,false);
  const unavailable=projectOtherData({readStates:{terminalBrainIncident:'UNAVAILABLE'}});
  assert.equal(unavailable.terminalBrainRecovery.status,'SOURCE_UNVERIFIED');
  assert.equal(unavailable.terminalBrainRecovery.occurrenceCount,null);
});
