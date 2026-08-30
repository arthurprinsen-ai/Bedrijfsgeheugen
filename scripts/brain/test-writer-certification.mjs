import fs from 'node:fs';
import assert from 'node:assert/strict';

const evidencePath='brain/evidence/writer-canary/paginacontrole-operational-certification.json';
assert.ok(fs.existsSync(evidencePath),'paginacontrole writer certification evidence must exist');

const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
assert.equal(evidence.contract,'BRAIN-DELIVERY-v2');
assert.equal(evidence.writer,'paginacontrole');
assert.equal(evidence.production_authority,'BG169');
assert.equal(evidence.outcome_router,'BG168');
assert.equal(evidence.current_state_projection,'BG167');
assert.equal(evidence.candidate_pr,417);
assert.equal(evidence.shadow_run_id,'33316041100');
assert.equal(evidence.shadow_artifact,'repo-writer-shadow-evidence-417');
assert.equal(evidence.impact_policy.max_changed_lines_per_file,50);
assert.equal(evidence.impact_policy.verified,true);
assert.ok(typeof evidence.idempotency_key==='string' && evidence.idempotency_key.length>0);

// Mechanical writer proof is real, but Brain completion must fail closed until
// BG168 routing and BG167 projection are independently acknowledged.
assert.equal(evidence.truth_status,'SUPPORTED');
assert.equal(evidence.status,'AWAITING_OUTCOME');
assert.equal(evidence.projection_verification?.bg168_routed,false);
assert.equal(evidence.projection_verification?.bg167_visible,false);
assert.equal(evidence.projection_verification?.verified,false);

const obligations=JSON.parse(fs.readFileSync('config/outcome-obligations.json','utf8'));
const obligation=obligations.registeredObligations.find(x=>x.id==='repository-writer-operational-certification');
assert.ok(obligation,'repository writer operational certification obligation must be registered');
assert.match(obligation.expected,/BG168/);
assert.match(obligation.expected,/BG167/);
assert.match(obligation.evidencePolicy,/BG167 visibility/i);

const migration=JSON.parse(fs.readFileSync('config/repository-writer-migration.json','utf8'));
const pageWriter=migration.writers.find(x=>x.name==='paginacontrole');
assert.ok(pageWriter,'paginacontrole must exist in repository writer migration state');
assert.equal(pageWriter.candidateMode,'merged_unverified');
assert.equal(pageWriter.operationalCandidateVerified,false);
assert.equal(pageWriter.operationalEvidence,undefined);

const reconcileScript='scripts/brain/reconcile-writer-certifications.mjs';
const reconcileWorkflow='.github/workflows/writer-certification-reconcile.yml';
assert.ok(fs.existsSync(reconcileScript),'writer certification reconciliation script must exist');
assert.ok(fs.existsSync(reconcileWorkflow),'writer certification reconciliation workflow must exist');
const script=fs.readFileSync(reconcileScript,'utf8');
assert.match(script,/projection_verification/);
assert.match(script,/bg168_routed/);
assert.match(script,/bg167_visible/);
assert.match(script,/verified/);
const workflow=fs.readFileSync(reconcileWorkflow,'utf8');
assert.match(workflow,/brain\/evidence\/writer-canary\/\*\.json/);
assert.match(workflow,/reconcile-writer-certifications\.mjs --write/);
assert.doesNotMatch(workflow,/git push origin HEAD:main|git push origin main/);

console.log('PASS writer certification fails closed until BG168 routing and BG167 visibility are independently verified');
