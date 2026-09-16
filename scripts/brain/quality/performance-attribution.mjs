export function attributePerformanceRegression(input = {}) {
  const baseline = Number(input.baseline);
  const current = Number(input.current);
  const regressed = Number.isFinite(baseline) && Number.isFinite(current) && current > baseline;
  const exactFields = ['candidateSha', 'route', 'api', 'functionName', 'queryFingerprint', 'dependency'];
  if (!regressed) return { status: 'NO_REGRESSION', baseline, current };
  if (exactFields.some(field => !input[field])) return { status: 'UNKNOWN', baseline, current, missing: exactFields.filter(field => !input[field]) };
  return {
    status: 'ATTRIBUTED',
    commit: input.candidateSha,
    route: input.route,
    api: input.api,
    function: input.functionName,
    query: input.queryFingerprint,
    dependency: input.dependency,
    baseline,
    current,
    delta: current - baseline,
    ratio: current / baseline,
  };
}
