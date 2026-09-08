const DEFAULT_SLO_MS = 300000;

export function classifyQueueHealth({ now = Date.now(), currentHeadByPr = {}, runs = [], sloMs = DEFAULT_SLO_MS } = {}) {
  const incidentsByFingerprint = new Map();
  const ignoredSuperseded = [];
  const healthy = [];

  for (const run of runs) {
    const prNumber = String(run.prNumber ?? '');
    const currentHead = currentHeadByPr[prNumber];
    if (currentHead && run.headSha !== currentHead) {
      ignoredSuperseded.push(run);
      continue;
    }

    const queuedAt = Date.parse(run.queuedAt ?? '');
    const ageMs = Number.isFinite(queuedAt) ? now - queuedAt : 0;
    const hasStarted = Boolean(run.firstStepStartedAt) || run.status === 'in_progress' || run.status === 'completed';
    if (run.status === 'queued' && !hasStarted && ageMs >= sloMs) {
      const fingerprint = `ci-capacity:${prNumber}:${run.headSha}:${run.workflow}:${run.jobFamily}`;
      if (!incidentsByFingerprint.has(fingerprint)) {
        incidentsByFingerprint.set(fingerprint, { ...run, ageMs, fingerprint, kind: 'current-head-queue-starvation' });
      }
    } else {
      healthy.push(run);
    }
  }

  return {
    incidents: [...incidentsByFingerprint.values()],
    ignoredSuperseded,
    healthy,
  };
}
