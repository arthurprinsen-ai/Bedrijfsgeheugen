function unique(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function topEntries(map, limit) {
  return [...map.entries()]
    .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key,count]) => ({ key, count }));
}

export function buildCiPatternMemory({
  runs = [],
  jobs = [],
  prFiles = {},
  policy
} = {}) {
  if (!policy || policy.version !== 'POWERHOUSE-CI-PATTERN-MEMORY-v1') {
    throw new TypeError('POWERHOUSE-CI-PATTERN-MEMORY-v1 policy is required');
  }

  const failedRuns = runs.filter(run => ['failure','cancelled','timed_out'].includes(run.conclusion));
  const failedPrNumbers = unique(
    failedRuns.flatMap(run => (run.pull_requests || []).map(pr => pr?.number).filter(Boolean))
  );

  const hotFileCounts = new Map();
  for (const prNumber of failedPrNumbers) {
    for (const file of unique(prFiles[prNumber] || [])) {
      hotFileCounts.set(file, (hotFileCounts.get(file) || 0) + 1);
    }
  }

  const failurePatternCounts = new Map();
  for (const job of jobs) {
    if (!['failure','cancelled','timed_out'].includes(job.conclusion)) continue;
    const signature = [job.workflow || 'unknown-workflow', job.job || 'unknown-job'].join('::');
    failurePatternCounts.set(signature, (failurePatternCounts.get(signature) || 0) + 1);
  }

  const hotFiles = topEntries(hotFileCounts, policy.maxHotFiles)
    .filter(item => item.count >= policy.hotFileMinFailures)
    .map(item => ({ path:item.key, failures:item.count, riskBoost:policy.riskBoost.hotFile }));

  const failurePatterns = topEntries(failurePatternCounts, policy.maxFailurePatterns)
    .filter(item => item.count >= policy.failurePatternMinOccurrences)
    .map(item => {
      const [workflow, job] = item.key.split('::');
      return { workflow, job, occurrences:item.count, riskBoost:policy.riskBoost.repeatedFailurePattern };
    });

  return Object.freeze({
    version: policy.version,
    hotFiles: Object.freeze(hotFiles),
    failurePatterns: Object.freeze(failurePatterns),
    stats: Object.freeze({
      failedRuns: failedRuns.length,
      failedPullRequests: failedPrNumbers.length,
      hotFiles: hotFiles.length,
      repeatedFailurePatterns: failurePatterns.length
    })
  });
}

export function applyPatternMemoryToPlan({ plan, changedPaths = [], memory } = {}) {
  if (!plan || !memory) return plan;
  const order = ['R0','R1','R2','R3','R4'];
  const hotSet = new Set((memory.hotFiles || []).map(item => item.path));
  const matchedHotFiles = unique(changedPaths).filter(path => hotSet.has(path));
  if (!matchedHotFiles.length) {
    return Object.freeze({ ...plan, ciPatternMemory: Object.freeze({ matchedHotFiles: Object.freeze([]), escalated:false }) });
  }
  const current = order.indexOf(plan.risk);
  const next = Math.min(order.length - 1, Math.max(current, 0) + 1);
  return Object.freeze({
    ...plan,
    risk: order[next],
    fullSharedSuite: next >= order.indexOf('R2') ? true : plan.fullSharedSuite,
    ciPatternMemory: Object.freeze({
      matchedHotFiles: Object.freeze(matchedHotFiles.sort()),
      escalated: next > current
    })
  });
}
