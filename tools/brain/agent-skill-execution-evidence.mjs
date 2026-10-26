/**
 * Agent skill execution evidence: pure validation for the existing Brain/Heartbeat lane.
 * No scheduler, network writes, release bypass or automatic skill activation.
 */
import { createHash } from 'node:crypto';

export const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9._:/-]{1,180}$/.test(value);
const validHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const unique = (values) => new Set(values).size === values.length;

/**
 * The caller must supply:
 * - trusted manifest: skill IDs, pinned versions and independently hashed content,
 * - loader receipts: emitted by the instrumented loader, not the agent's prose,
 * - decision evidence: evaluated against required machine-checkable assertions,
 * - verifier: independent evaluator's decision for this exact run.
 * A valid shape is not proof that an external provider executed anything.
 */
export function validateSkillExecutionEvidence(record, manifest) {
  const errors = [];
  if (!record || typeof record !== 'object' || !validId(record.runId) || !validId(record.agentId)) {
    return { status: 'UNPROVEN', errors: ['RUN_IDENTITY_MISSING'] };
  }
  if (!manifest || !Array.isArray(manifest.requiredSkills) || !manifest.requiredSkills.length) {
    return { status: 'UNPROVEN', errors: ['TRUSTED_MANIFEST_MISSING'] };
  }
  const skills = manifest.requiredSkills;
  if (!unique(skills.map(s => s.id))) errors.push('DUPLICATE_REQUIRED_SKILL');
  const receipts = Array.isArray(record.loaderReceipts) ? record.loaderReceipts : [];
  const applications = Array.isArray(record.applications) ? record.applications : [];
  for (const skill of skills) {
    if (!validId(skill.id) || !validHash(skill.contentSha256) || !validId(skill.version)) {
      errors.push('INVALID_SKILL_MANIFEST'); continue;
    }
    const matched = receipts.filter(r => r.skillId === skill.id);
    if (matched.length !== 1) { errors.push(`LOAD_RECEIPT_COUNT:${skill.id}`); continue; }
    const receipt = matched[0];
    if (receipt.runId !== record.runId || receipt.agentId !== record.agentId ||
      receipt.version !== skill.version || receipt.contentSha256 !== skill.contentSha256 ||
      receipt.loaded !== true || !validId(receipt.loaderId) || !receipt.loadedAt) {
      errors.push(`SKILL_LOAD_UNPROVEN:${skill.id}`);
    }
    const applied = applications.filter(a => a.skillId === skill.id);
    if (applied.length !== 1 || applied[0].runId !== record.runId ||
      !Array.isArray(applied[0].assertions) || !applied[0].assertions.length ||
      !applied[0].assertions.every(a => validId(a.id) && a.passed === true && validId(a.evidenceRef))) {
      errors.push(`SKILL_APPLICATION_UNPROVEN:${skill.id}`);
    }
  }
  const verifier = record.verifier;
  if (!verifier || verifier.runId !== record.runId || verifier.independent !== true ||
      verifier.passed !== true || !validId(verifier.evidenceRef) || !validId(verifier.verifierId) ||
      verifier.verifierId === record.agentId) errors.push('INDEPENDENT_VERIFICATION_MISSING');
  if (record.innovation && record.innovation.activationRequested === true &&
      (!record.innovation.reviewApproved || !validId(record.innovation.reviewEvidenceRef))) {
    errors.push('INNOVATION_APPROVAL_REQUIRED');
  }
  return { status: errors.length ? 'UNPROVEN' : 'VERIFIED_EVIDENCE', errors };
}

export function summarizeAgentCoverage(records, manifests) {
  const results = records.map(record => ({
    runId: record?.runId ?? null,
    agentId: record?.agentId ?? null,
    ...validateSkillExecutionEvidence(record, manifests?.[record?.agentId])
  }));
  return {
    status: results.length && results.every(x => x.status === 'VERIFIED_EVIDENCE')
      ? 'VERIFIED_EVIDENCE' : 'UNPROVEN',
    checkedRuns: results.length,
    verifiedRuns: results.filter(x => x.status === 'VERIFIED_EVIDENCE').length,
    results
  };
}
