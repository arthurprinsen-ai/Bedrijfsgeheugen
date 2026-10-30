import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const proofSha='c986ae2a49c09daf349ae365e95c7fbc31a1f8ba';
const deployId='6ae45d9944f9ea2b285e27f3';

test('append-only human release record names the immutable independent provider receipt, not a mock',()=>{
 const change=read('docs/changes/2026-10-30-one-loop-deploy-proof-release-guard.md');
 const ledger=read('docs/development-ledger-events/2026-10-30-one-loop-deploy-proof-release-guard.md');
 for(const source of [change,ledger]){
  assert.ok(source.includes(proofSha));
  assert.ok(source.includes(deployId));
  assert.ok(source.includes('41030754918'));
  assert.match(source,/9 GREEN[,\s/]+1 AMBER[,\s/]+5 RED/);
  assert.match(source,/PROVEN/);
  assert.match(source,/RED/);
 }
 assert.match(change,/\b\/api\/powerhouse-cro-other-data\b/);
 assert.match(change,/nog geen afzonderlijk geauthenticeerde twee-tenant-E2E-proef/);
 assert.match(ledger,/Nog open:/);
});

test('old historical failure observation stays immutable, software proof is not a proven buyer outcome',()=>{
 const old=JSON.parse(read('brain/learning/2026-10-30-one-loop-deploy-proof-release-guard-v1.json'));
 assert.equal(old.maturity,'OBSERVED');
 assert.equal(old.evidence.nested_proof_payload_readback_proven,false);
 assert.equal(old.terminal_proof.state,'PROVEN_SOFTWARE_AND_ADMIN_ROUTE_ONLY');
 assert.equal(old.terminal_proof.nested_one_loop_proof,'PROVEN');
 assert.equal(old.terminal_proof.original_provider_readback_run,41030754918);
 assert.equal(old.terminal_proof.original_brain_loop_counts.overallStatus,'RED');
 assert.equal(old.terminal_proof.commercial_outcome_evidence_proven,false);
 assert.equal(old.terminal_proof.natural_agent_learning_application_proven,false);
 const skill=read('.agents/skills/powerhouse-netlify-production-truth/SKILL.md');
 assert.ok(skill.includes(proofSha));
 assert.match(skill,/ORIGINAL_15_LOOP_GUARDS/);
 assert.match(skill,/CRO_7_COMMERCIAL_GATES/);
 assert.match(skill,/EXTERNAL_PROVIDER_OUTCOMES/);
 assert.match(skill,/NATURAL_LEARNING_APPLIED/);
 assert.match(skill,/UNVERIFIED/);
 assert.match(skill,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
});

test('original production readback still enforces nested signed admin proof, not deploy-only success',()=>{
 const workflow=read('.github/workflows/production-release-readback.yml');
 const verifier=read('platform/api/portal-authenticated-production-proof-core.mjs');
 assert.match(workflow,/assertOneLoopProductionReleaseProof\(proof\)/);
 assert.match(verifier,/ONE_LOOP_ADMIN_PROOF_NOT_PROVEN/);
 assert.match(verifier,/ONE_LOOP_SYNTHETIC_CLEANUP_NOT_VERIFIED/);
 assert.match(verifier,/ONE_LOOP_CANONICAL_/);
});
