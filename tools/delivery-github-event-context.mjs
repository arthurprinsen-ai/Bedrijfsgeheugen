const SHA_RE = /^[0-9a-f]{40}$/i;

function requireSha(label, value) {
  if (!SHA_RE.test(String(value || ''))) {
    throw new Error(`valid ${label} required`);
  }
  return String(value).toLowerCase();
}

function requireRunId(runId) {
  const value = String(runId || '').trim();
  if (!value) throw new Error('valid runId required');
  return value;
}

export function normalizeGitHubDeliveryEvent({
  eventName,
  event = {},
  githubSha,
  runId,
  fallbackBaseSha,
} = {}) {
  const safeRunId = requireRunId(runId);
  let mode;
  let changeId;
  let baseSha;
  let changeHeadSha;
  let candidateSha;
  let prNumber;

  if (eventName === 'pull_request') {
    const pr = event.pull_request || {};
    const number = String(pr.number || '').trim();
    if (!number) throw new Error('valid pull request number required');
    mode = 'pull_request';
    changeId = `pr-${number}`;
    baseSha = pr.base?.sha;
    changeHeadSha = pr.head?.sha;
    candidateSha = githubSha;
    prNumber = number;
  } else if (eventName === 'merge_group') {
    const group = event.merge_group || {};
    mode = 'merge_group';
    baseSha = group.base_sha;
    changeHeadSha = group.head_sha || githubSha;
    candidateSha = group.head_sha || githubSha;
    prNumber = safeRunId;
    changeId = `merge-group-${String(candidateSha || '').slice(0, 12)}`;
  } else if (eventName === 'workflow_dispatch') {
    mode = 'workflow_dispatch';
    baseSha = fallbackBaseSha;
    changeHeadSha = githubSha;
    candidateSha = githubSha;
    prNumber = safeRunId;
    changeId = `dispatch-${safeRunId}`;
  } else {
    throw new Error(`unsupported GitHub delivery event: ${eventName || 'unknown'}`);
  }

  const normalizedBaseSha = requireSha('baseSha', baseSha);
  const normalizedChangeHeadSha = requireSha('changeHeadSha', changeHeadSha);
  const normalizedCandidateSha = requireSha('candidateSha', candidateSha);

  return Object.freeze({
    mode,
    changeId,
    baseSha: normalizedBaseSha,
    changeHeadSha: normalizedChangeHeadSha,
    candidateSha: normalizedCandidateSha,
    headSha: normalizedCandidateSha,
    prNumber,
  });
}
