import { pathToFileURL } from 'node:url';

export function evaluateSuccessorCreation({ priorCandidateOpen = true, existingCandidateSynchronizable = true, driftDecision } = {}) {
  if (!driftDecision || !['KEEP_TESTED_FEATURE','SYNC_REQUIRED'].includes(driftDecision.action)) {
    throw new TypeError('valid driftDecision is required');
  }
  if (!priorCandidateOpen) return Object.freeze({ allowed:true, action:'CREATE_NEW_CHANGE', reason:'no-open-prior-candidate' });
  if (driftDecision.action !== 'SYNC_REQUIRED') {
    return Object.freeze({ allowed:false, action:'REUSE_EXISTING_CANDIDATE', reason:'successor-forbidden-without-sync-required' });
  }
  if (existingCandidateSynchronizable !== false) {
    return Object.freeze({ allowed:false, action:'SYNC_EXISTING_CANDIDATE', reason:'sync-existing-candidate-first' });
  }
  return Object.freeze({ allowed:true, action:'CREATE_SUCCESSOR', reason:'sync-required-existing-candidate-unsynchronizable' });
}

export function evaluatePullRequestSuccessorGuard({ title = '', body = '' } = {}) {
  const text = `${title}\n${body}`;
  const claimsSuccessor = /\b(successor|supersed(?:e|es|ed)|rebuilt?\s+(?:from|on)|rebas(?:e|ed|ing)\s+(?:on|to)|moving[- ]main|main\s+moved|current\s+main)\b/i.test(text);
  if (!claimsSuccessor) return Object.freeze({ ok:true, state:'NOT_A_SUCCESSOR', action:'CONTINUE' });
  const syncRequired = /Handoff-Decision:\s*SYNC_REQUIRED\b/i.test(body);
  const unsynchronizable = /Existing-Candidate-Synchronizable:\s*false\b/i.test(body);
  const evidence = /Handoff-Evidence:\s*(changed-path-overlap|declared-contract-overlap|merge-conflict|declared-dependency-conflict)\b/i.test(body);
  if (!syncRequired) return Object.freeze({ ok:false, state:'SUCCESSOR_BLOCKED', action:'REUSE_OR_SYNC_EXISTING_CANDIDATE', reason:'missing-sync-required-evidence' });
  if (!evidence) return Object.freeze({ ok:false, state:'SUCCESSOR_BLOCKED', action:'SYNC_EXISTING_CANDIDATE', reason:'missing-overlap-evidence' });
  if (!unsynchronizable) return Object.freeze({ ok:false, state:'SUCCESSOR_BLOCKED', action:'SYNC_EXISTING_CANDIDATE', reason:'existing-candidate-not-proven-unsynchronizable' });
  return Object.freeze({ ok:true, state:'SUCCESSOR_ALLOWED', action:'CREATE_SUCCESSOR' });
}

function main() {
  const result = evaluatePullRequestSuccessorGuard({ title:process.env.PR_TITLE || '', body:process.env.PR_BODY || '' });
  const out = `${JSON.stringify(result)}\n`;
  (result.ok ? process.stdout : process.stderr).write(out);
  if (!result.ok) process.exitCode = 42;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
