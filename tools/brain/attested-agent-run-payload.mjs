/**
 * Attested agent-run payload for the existing ONE BRAIN cycle writer.
 * Pure function: no scheduler, no network, no database write, no new authority.
 *
 * It only turns an already independently verified run (see
 * agent-skill-execution-evidence.mjs) into the event payload fields that the
 * 5 Nov 2026 measurement found missing: agent_id, skill_version, before/after.
 * Without VERIFIED_EVIDENCE the payload stays UNKNOWN_NOT_ATTESTED and carries
 * no agent_id, so unattested work can never look attested.
 */
import { validateSkillExecutionEvidence } from './agent-skill-execution-evidence.mjs';

export const ATTESTED_AGENT_RUN_CONTRACT = 'attested-agent-run-payload-v1';

const hasValue = (v) => v !== undefined && v !== null && typeof v === 'object' && Object.keys(v).length > 0;

export function buildAttestedAgentRunPayload({ record, manifest, before, after } = {}) {
  const unattested = (reason) => ({
    agent_attribution: 'UNKNOWN_NOT_ATTESTED',
    writer_contract: ATTESTED_AGENT_RUN_CONTRACT,
    attestation_blocker: reason
  });
  if (!hasValue(before) || !hasValue(after)) return unattested('BEFORE_AFTER_MISSING');
  const verdict = validateSkillExecutionEvidence(record, manifest);
  if (verdict.status !== 'VERIFIED_EVIDENCE') return unattested(verdict.errors.join(',') || 'UNPROVEN');
  const skillVersion = manifest.requiredSkills
    .map((s) => `${s.id}@${s.version}#${s.contentSha256.slice(0, 12)}`)
    .sort()
    .join('+');
  return {
    agent_attribution: 'ATTESTED_VERIFIED_EVIDENCE',
    writer_contract: ATTESTED_AGENT_RUN_CONTRACT,
    agent_id: record.agentId,
    run_id: record.runId,
    skill_version: skillVersion,
    verifier_id: record.verifier.verifierId,
    before,
    after
  };
}
