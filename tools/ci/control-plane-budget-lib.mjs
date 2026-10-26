export function evaluateWorkflowRatchet({ baselineNames, currentNames, targetCount }) {
  const baseline = [...new Set(baselineNames)].sort();
  const current = [...new Set(currentNames)].sort();
  const baselineSet = new Set(baseline);
  const newNames = current.filter((name) => !baselineSet.has(name));
  const currentCount = current.length;
  const baselineCount = baseline.length;
  const overBaseline = currentCount > baselineCount;
  return {
    ok: newNames.length === 0 && !overBaseline,
    baselineCount,
    currentCount,
    targetCount,
    newNames,
    remainingDebt: Math.max(0, currentCount - targetCount),
  };
}
