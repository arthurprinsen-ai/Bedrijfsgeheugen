import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const record=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-04-first-time-right-native-admission-stage2-v1.json',import.meta.url),'utf8'));
const workflow=readFileSync(new URL('../.github/workflows/powerhouse-delivery-hygiene.yml',import.meta.url),'utf8');
test('genuine protected source rollout and negative/positive exact head are immutable in original BRAIN learning',()=>{
 assert.equal(record.status,'NATIVE_ADMISSION_LIVE_VERIFIED');
 assert.equal(record.evidence.live_trusted_admission_merge,'feb1635b374ed93a5fdacdc498eeefc8b596eb26');
 const n=record.evidence.original_negative_probe,p=record.evidence.original_positive_probe;
 assert.equal(n.status,'FIRST_TIME_RIGHT_PREBUILD_BLOCKED');
 assert.equal(n.fingerprint,'powerhouse|prebuild|module_syntax_rejected');
 assert.match(n.root_cause,/revisionInput.*already been declared/);
 assert.equal(n.no_provider_side_effect,true);
 assert.equal(p.status,'FIRST_TIME_RIGHT_PREBUILD_READY');
 assert.equal(p.original_admission,'ADMITTED');
 assert.equal(p.integration_closure,'CANONICAL_INTEGRATION_CLOSURE_COMPLETE');
 assert.notEqual(n.head_sha,p.head_sha);
 assert.equal(record.evidence.test_pr_status,'CLOSED_UNMERGED');
});
test('original canonical ONE BRAIN proof is explicitly a synthetic canary and auto-ingestion is not falsely proven',()=>{
 const b=record.evidence.canonical_brain_readback;
 assert.equal(b.table,'public.brain_failure_occurrences');
 assert.equal(b.original_writer,'public.brain_observe_failure');
 assert.equal(b.is_synthetic,true);
 assert.equal(b.occurrence_count,1);
 assert.match(b.occurrence_id,/run:41797450956/);
 assert.equal(record.evidence.automated_github_to_brain_ingestion,'NOT_YET_INDEPENDENTLY_PROVEN');
});
test('original native admission still loads protected main parser and fails CLOSED',()=>{
 assert.match(workflow,/const trustedFtrSha = currentMainSha/);
 assert.match(workflow,/FIRST_TIME_RIGHT_PREBUILD_BLOCKED/);
 assert.match(workflow,/first_time_right: firstTimeRightFailure/);
 assert.match(workflow,/\.artifacts\/powerhouse-prebuild-evidence\.json/);
 assert.doesNotMatch(workflow,/DISABLE_FIRST_TIME_RIGHT|SKIP_ALL_GATES|ALLOW_PRODUCTION_FAKE_GREEN/);
});
