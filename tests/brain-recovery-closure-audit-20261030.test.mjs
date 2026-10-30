import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectRecoveryClosureAudit} from '../netlify/functions/_powerhouse-recovery-closure-audit.mjs';
const now='2026-10-30T17:45:00Z';
const base={fingerprint:'incident|canonical|sample',last_seen_at:'2026-10-28T10:00:00Z',
  maturity:'VALIDATED',occurrence_count:2,root_cause:'reproducible source drift',
  proven_fix:'guard repaired',prevention_rule:'block bad source before use',
  regression_ref:'tests/real-provider-regression.test.mjs'};
const full={...base,evidence:{recovery_closure_v1:{
  regressionPassed:true,
  production:{commitSha:'a'.repeat(40),providerReceiptId:'provider:1',verifiedAt:'2026-10-28T12:00:00Z'},
  naturalRun:{runId:'natural:2',canonicalOwnerVerified:true,verifiedAt:'2026-10-29T12:00:00Z'},
  independentResult:{source:'authoritative-provider',providerReceiptId:'outcome:3',verified:true,verifiedAt:'2026-10-29T13:00:00Z'},
  recurrenceCheck:{sourceId:'recheck:4',passed:true,verifiedAt:'2026-10-30T15:00:00Z',
    lastIncidentAt:'2026-10-28T10:00:00Z'}
}}};
test('original missing read is unknown, never green',()=>{
 const r=projectRecoveryClosureAudit([],{at:now});
 assert.equal(r.status,'UNVERIFIED');assert.equal(r.independentlyVerified,false);
});
test('real recurring register without root cause stays open',()=>{
 const r=projectRecoveryClosureAudit([{...base,maturity:'OBSERVED',root_cause:null,proven_fix:null,
   prevention_rule:null,regression_ref:null}],{sourceState:'LIVE',at:now});
 assert.equal(r.evidenceDebt,1);assert.ok(r.cases[0].missing.includes('CAUSE_DOCUMENTED'));
 assert.equal(r.cases[0].repairClosed,false);
});
test('all stored receipts are still NOT independent provider proof',()=>{
 const r=projectRecoveryClosureAudit([full],{sourceState:'LIVE',at:now});
 assert.equal(r.recordedProofCandidates,1);
 assert.equal(r.cases[0].state,'STORED_PROOF_REQUIRES_INDEPENDENT_EXTERNAL_CROSSCHECK');
 assert.equal(r.independentlyVerified,false);assert.equal(r.cases[0].repairClosed,false);
});
test('fake recheck timing, duplicate receipts and reopened incident fail closed',()=>{
 for(const x of [
  {evidence:{recovery_closure_v1:{...full.evidence.recovery_closure_v1,
    recurrenceCheck:{...full.evidence.recovery_closure_v1.recurrenceCheck,verifiedAt:'2026-10-29T12:01:00Z'}}}},
  {evidence:{recovery_closure_v1:{...full.evidence.recovery_closure_v1,
    independentResult:{...full.evidence.recovery_closure_v1.independentResult,providerReceiptId:'provider:1'}}}},
  {last_seen_at:'2026-10-30T10:00:00Z'}
 ]){const r=projectRecoveryClosureAudit([{...full,...x}],{sourceState:'LIVE',at:now});
   assert.equal(r.recordedProofCandidates,0);assert.equal(r.cases[0].repairClosed,false);}
});
test('real portal and authenticated original source wiring are present',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/brain_failure_registry/);
 assert.match(api,/projectRecoveryClosureAudit/);
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(ui,/data-recovery-closure-audit/);
 assert.doesNotMatch(api,/config\s*=\s*\{\s*schedule\s*:/);
});
