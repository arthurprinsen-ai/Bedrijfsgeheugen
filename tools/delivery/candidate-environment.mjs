const required = ['change_id','pr','git_sha','netlify_deploy_id','supabase_branch_id','schema_revision','artifact_digest','evidence'];

export function validateCandidateEnvironment(candidate = {}) {
  const errors = [];
  for (const key of required) if (candidate[key] === undefined || candidate[key] === null || candidate[key] === '') errors.push(`missing:${key}`);
  if (!/^[0-9a-f]{40}$/.test(candidate.git_sha || '')) errors.push('invalid:git_sha');
  if (!/^sha256:[0-9a-f]{64}$/.test(candidate.artifact_digest || '')) errors.push('invalid:artifact_digest');
  const evidence = candidate.evidence || {};
  if (evidence.frontend_sha !== candidate.git_sha) errors.push('mismatch:frontend_sha');
  if (evidence.backend_sha !== candidate.git_sha) errors.push('mismatch:backend_sha');
  if (evidence.database_schema_revision !== candidate.schema_revision) errors.push('mismatch:schema_revision');
  return { ok: errors.length === 0, status: errors.length ? 'CANDIDATE_IDENTITY_FAILED' : 'CANDIDATE_IDENTITY_VERIFIED', errors };
}
