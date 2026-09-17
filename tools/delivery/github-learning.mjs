import { createHash } from 'node:crypto';

function parseMs(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isFinite(parsed) ? parsed : null;
}

function duration(start, end) {
  const a = parseMs(start);
  const b = parseMs(end);
  return a !== null && b !== null && b >= a ? b - a : 0;
}

function failureShape(input, workflows) {
  return {
    mergeable: input.pr?.mergeable === false ? 'conflict_or_blocked' : 'mergeable_or_unknown',
    mainMovements: Number(input.mainMovements ?? 0) > 0,
    mergeConflicts: Number(input.mergeConflicts ?? 0) > 0,
    workflowFailures: workflows
      .filter((workflow) => workflow.conclusion === 'failure')
      .map((workflow) => workflow.name)
      .sort(),
    rerunWorkflows: workflows
      .filter((workflow) => Number(workflow.attempt ?? 1) > 1)
      .map((workflow) => workflow.name)
      .sort(),
  };
}

export function normalizeGitHubDeliveryTelemetry(input = {}) {
  const workflows = Array.isArray(input.workflows) ? input.workflows : [];
  const queueMs = workflows.reduce((total, workflow) => total + duration(workflow.queuedAt, workflow.startedAt), 0);
  const workflowRuntimeMs = workflows.reduce((total, workflow) => total + duration(workflow.startedAt, workflow.completedAt), 0);
  const reruns = workflows.filter((workflow) => Number(workflow.attempt ?? 1) > 1).length;
  const failedAttempts = workflows.filter((workflow) => workflow.conclusion === 'failure').length;
  const createdAt = input.pr?.createdAt;

  const shape = failureShape(input, workflows);
  const failureFingerprint = `github-delivery:${createHash('sha256').update(JSON.stringify(shape)).digest('hex').slice(0, 20)}`;

  return {
    obligationId: input.obligationId ?? null,
    prNumber: input.pr?.number ?? null,
    headSha: input.pr?.headSha ?? null,
    baseSha: input.pr?.baseSha ?? null,
    queueMs,
    workflowRuntimeMs,
    reruns,
    failedAttempts,
    mainMovements: Number(input.mainMovements ?? 0),
    mergeConflicts: Number(input.mergeConflicts ?? 0),
    supersedes: input.pr?.supersedes ?? null,
    obligationToLiveMs: duration(createdAt, input.liveProvenAt),
    obligationToFulfilledMs: duration(createdAt, input.fulfilledAt),
    failureFingerprint,
  };
}
