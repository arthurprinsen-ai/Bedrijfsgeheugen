import fs from 'node:fs';
import assert from 'node:assert/strict';

const evidencePath='brain/evidence/writer-canary/paginacontrole-operational-certification.json';
assert.ok(fs.existsSync(evidencePath),'verified paginacontrole writer certification evidence must exist');

const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
assert.equal(evidence.contract,'BRAIN-DELIVERY-v2');
assert.equal(evidence.writer,'paginacontrole');
assert.equal(evidence.truth_status,'VERIFIED');
assert.equal(evidence.status,'COMPLETED');
assert.equal(evidence.production_authority,'BG169');
assert.equal(evidence.outcome_router,'BG168');
assert.equal(evidence.current_state_projection,'BG167');
assert.equal(evidence.candidate_pr,417);
assert.equal(evidence.shadow_run_id,'33316041100');
assert.equal(evidence.shadow_artifact,'repo-writer-shadow-evidence-417');
assert.equal(evidence.impact_policy.max_changed_lines_per_file,50);
assert.equal(evidence.impact_policy.verified,true);
assert.ok(typeof evidence.verified_at==='string' && evidence.verified_at.length>0);
assert.ok(typeof evidence.idempotency_key==='string' && evidence.idempotency_key.length>0);

const obligations=JSON.parse(fs.readFileSync('config/outcome-obligations.json','utf8'));
const obligation=obligations.registeredObligations.find(x=>x.id==='repository-writer-operational-certification');
assert.ok(obligation,'repository writer operational certification obligation must be registered');
assert.equal(obligation.domain,'governance');
assert.match(obligation.expected,/BG168/);
assert.match(obligation.expected,/BG167/);
assert.match(obligation.evidencePolicy,/immutable shadow evidence/i);

const migration=JSON.parse(fs.readFileSync('config/repository-writer-migration.json','utf8'));
const pageWriter=migration.writers.find(x=>x.name==='paginacontrole');
assert.ok(pageWriter,'paginacontrole must exist in repository writer migration state');
assert.equal(pageWriter.candidateMode,'operational_verified');
assert.equal(pageWriter.operationalCandidateVerified,true);
assert.equal(pageWriter.operationalEvidence.verificationPullRequest,evidence.verification_pr);
assert.equal(pageWriter.operationalEvidence.writerPullRequest,evidence.candidate_pr);
assert.equal(String(pageWriter.operationalEvidence.shadowRunId),String(evidence.shadow_run_id));
assert.equal(pageWriter.operationalEvidence.headSha,evidence.candidate_head_sha);
assert.equal(pageWriter.operationalEvidence.candidateBranch,evidence.candidate_branch);

const reconcileScript='scripts/brain/reconcile-writer-certifications.mjs';
const reconcileWorkflow='.github/workflows/writer-certification-reconcile.yml';
assert.ok(fs.existsSync(reconcileScript),'writer certification reconciliation script must exist');
assert.ok(fs.existsSync(reconcileWorkflow),'writer certification reconciliation workflow must exist');
const workflow=fs.readFileSync(reconcileWorkflow,'utf8');
assert.match(workflow,/brain\/evidence\/writer-canary\/\*\.json/);
assert.match(workflow,/reconcile-writer-certifications\.mjs --write/);
assert.match(workflow,/brain\/writer-certification-reconcile\//);
assert.match(workflow,/gh pr create/);
assert.doesNotMatch(workflow,/git push origin HEAD:main|git push origin main/);

console.log('PASS writer certification is durable Brain evidence and automatically reconciles into shared writer state');
