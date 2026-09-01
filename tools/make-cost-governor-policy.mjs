const CRITICAL_CLASSES = new Set([
  'CRITICAL_PUBLISHING',
  'CRITICAL_REVENUE_OUTCOME',
  'CRITICAL_RECOVERY_SECURITY',
  'CRITICAL_BRAIN',
]);

function finiteNonNegative(value, name, { required = true } = {}) {
  if ((value === null || value === undefined || value === '') && !required) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a finite non-negative number`);
  return n;
}

function ratioZone(ratio, projected) {
  if (projected || ratio >= 0.95) return 'HARD';
  if (ratio >= 0.80) return 'RED';
  if (ratio >= 0.60) return 'AMBER';
  return 'GREEN';
}

const ZONE_RANK = { GREEN: 0, AMBER: 1, RED: 2, HARD: 3 };

export function classifyMakeBudget(input = {}) {
  const monthlyCapBytes = finiteNonNegative(input.monthlyCapBytes, 'monthlyCapBytes');
  if (monthlyCapBytes <= 0) throw new Error('monthlyCapBytes must be greater than zero');

  const usedBytes = finiteNonNegative(input.usedBytes ?? 0, 'usedBytes');
  const monthUsedBytes = finiteNonNegative(input.monthUsedBytes ?? 0, 'monthUsedBytes');
  const dayOfMonth = Math.max(1, Math.trunc(finiteNonNegative(input.dayOfMonth ?? 1, 'dayOfMonth')));
  const daysInMonth = Math.max(dayOfMonth, Math.trunc(finiteNonNegative(input.daysInMonth ?? dayOfMonth, 'daysInMonth')));
  const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1);
  const remainingMonthBytes = Math.max(0, monthlyCapBytes - monthUsedBytes);
  const safeDailyAllowanceBytes = remainingMonthBytes / remainingDays;
  const byteRatio = safeDailyAllowanceBytes > 0 ? usedBytes / safeDailyAllowanceBytes : Infinity;
  const byteProjected = monthUsedBytes + usedBytes >= monthlyCapBytes;
  const byteZone = ratioZone(byteRatio, byteProjected);

  const monthlyCreditCap = finiteNonNegative(input.monthlyCreditCap, 'monthlyCreditCap', { required: false });
  let creditRatio = 0;
  let safeDailyAllowanceCredits = null;
  let creditProjected = false;
  let creditZone = 'GREEN';

  if (monthlyCreditCap !== null && monthlyCreditCap > 0) {
    const usedCredits = finiteNonNegative(input.usedCredits ?? 0, 'usedCredits');
    const monthUsedCredits = finiteNonNegative(input.monthUsedCredits ?? 0, 'monthUsedCredits');
    const remainingCredits = Math.max(0, monthlyCreditCap - monthUsedCredits);
    safeDailyAllowanceCredits = remainingCredits / remainingDays;
    creditRatio = safeDailyAllowanceCredits > 0 ? usedCredits / safeDailyAllowanceCredits : Infinity;
    creditProjected = monthUsedCredits + usedCredits >= monthlyCreditCap;
    creditZone = ratioZone(creditRatio, creditProjected);
  }

  const zone = ZONE_RANK[creditZone] > ZONE_RANK[byteZone] ? creditZone : byteZone;
  const projectedMonthExhaustion = byteProjected || creditProjected;
  const actionPolicy = zone === 'GREEN'
    ? 'NORMAL'
    : zone === 'AMBER'
      ? 'SHRINK_PAYLOADS'
      : zone === 'RED'
        ? 'THROTTLE_NON_CRITICAL'
        : 'FAIL_CLOSED_NON_ESSENTIAL';

  return {
    zone,
    byteRatio,
    creditRatio,
    projectedMonthExhaustion,
    safeDailyAllowanceBytes,
    safeDailyAllowanceCredits,
    remainingDays,
    actionPolicy,
  };
}

export function classifyScenarioAnomaly(input = {}) {
  const bytesPerRun = finiteNonNegative(input.bytesPerRun ?? 0, 'bytesPerRun');
  const baselineBytesPerRun = finiteNonNegative(input.baselineBytesPerRun ?? 0, 'baselineBytesPerRun');
  const bytesPerOperation = finiteNonNegative(input.bytesPerOperation ?? 0, 'bytesPerOperation');
  const baselineBytesPerOperation = finiteNonNegative(input.baselineBytesPerOperation ?? 0, 'baselineBytesPerOperation');
  const dailyBytesDelta = finiteNonNegative(input.dailyBytesDelta ?? 0, 'dailyBytesDelta');
  const safeDailyAllowanceBytes = finiteNonNegative(input.safeDailyAllowanceBytes ?? 0, 'safeDailyAllowanceBytes');
  const zeroValueRuns = finiteNonNegative(input.zeroValueRuns ?? 0, 'zeroValueRuns');
  const criticality = String(input.criticality || 'STANDARD_OPERATIONAL');
  const budgetZone = String(input.budgetZone || 'GREEN');

  let anomalous = false;
  let reason = 'STABLE';
  if (baselineBytesPerRun > 0 && bytesPerRun >= baselineBytesPerRun * 2) {
    anomalous = true;
    reason = 'BYTES_PER_RUN_2X_BASELINE';
  } else if (baselineBytesPerOperation > 0 && bytesPerOperation >= baselineBytesPerOperation * 2) {
    anomalous = true;
    reason = 'BYTES_PER_OPERATION_2X_BASELINE';
  } else if (safeDailyAllowanceBytes > 0 && dailyBytesDelta >= safeDailyAllowanceBytes * 0.20) {
    anomalous = true;
    reason = 'MATERIAL_DAILY_ALLOWANCE_SHARE';
  } else if (zeroValueRuns >= 3 && dailyBytesDelta > 0) {
    anomalous = true;
    reason = 'REPEATED_LOW_VALUE_TRANSFER';
  }

  let degradation = 'NORMAL';
  if ((budgetZone === 'RED' || budgetZone === 'HARD') && CRITICAL_CLASSES.has(criticality)) {
    degradation = 'PRESERVE';
  } else if (budgetZone === 'HARD') {
    degradation = 'FAIL_CLOSED_NON_ESSENTIAL';
  } else if (budgetZone === 'RED' && criticality === 'DISCRETIONARY_ENRICHMENT') {
    degradation = 'THROTTLE';
  } else if (budgetZone === 'RED') {
    degradation = 'DEGRADE';
  } else if (budgetZone === 'AMBER') {
    degradation = 'SHRINK_PAYLOADS';
  }

  return {
    anomalous,
    reason,
    criticality,
    budgetZone,
    degradation,
    ratios: {
      bytesPerRun: baselineBytesPerRun > 0 ? bytesPerRun / baselineBytesPerRun : null,
      bytesPerOperation: baselineBytesPerOperation > 0 ? bytesPerOperation / baselineBytesPerOperation : null,
      dailyAllowanceShare: safeDailyAllowanceBytes > 0 ? dailyBytesDelta / safeDailyAllowanceBytes : null,
    },
  };
}
