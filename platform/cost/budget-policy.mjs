const OPTIONAL_WORK = new Set(['research', 'creative', 'experiment', 'optimization', 'unclassified']);
const RUNNABLE_DECISIONS = new Set(['RUN', 'CHEAP_PATH', 'PROTECTED_INTERRUPT']);

export function requireRunnableBudgetEnvelope(envelope) {
  if (!envelope || envelope.current !== true || !String(envelope.snapshotFingerprint ?? '').trim()) {
    throw new Error('current budget envelope with snapshot fingerprint is required');
  }
  if (!RUNNABLE_DECISIONS.has(envelope.decision)) {
    throw new Error(`budget decision ${String(envelope.decision ?? 'UNKNOWN')} blocks optional work`);
  }
  for (const field of ['remainingCredits', 'dailyAllowance']) {
    const value = Number(envelope[field]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`budget envelope ${field} is invalid`);
  }
  return envelope;
}

function calendarPosition(now) {
  const instant = new Date(now);
  if (!Number.isFinite(instant.getTime())) return null;

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
  const daysInMonth = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  return { dayOfMonth: parts.day, daysInMonth };
}

export function evaluateBudget(input = {}) {
  const monthlyLimit = Number(input.monthlyLimit);
  const usedCredits = Number(input.usedCredits);
  const position = calendarPosition(input.now);
  if (!(monthlyLimit > 0) || !(usedCredits >= 0) || !position || typeof input.workClass !== 'string') {
    throw new TypeError('valid monthly budget input required');
  }

  const remainingCredits = Math.max(0, monthlyLimit - usedCredits);
  const remainingDays = Math.max(1, position.daysInMonth - position.dayOfMonth + 1);
  const dailyAllowance = remainingCredits / remainingDays;
  const dailyBurn = Number(input.dailyBurn);
  const paceRatio = dailyBurn > 0 && dailyAllowance > 0
    ? dailyBurn / dailyAllowance
    : usedCredits / monthlyLimit;
  const state = usedCredits >= monthlyLimit || paceRatio >= 1
    ? 'EXHAUSTED'
    : paceRatio >= 0.90
      ? 'RED'
      : paceRatio >= 0.70
        ? 'ORANGE'
        : 'GREEN';

  if (input.protectedInterrupt === true) {
    return Object.freeze({ state, remainingCredits, dailyAllowance, paceRatio, decision: 'PROTECTED_INTERRUPT', reason: 'PROTECTED_OUTCOME' });
  }

  const optional = OPTIONAL_WORK.has(input.workClass.toLowerCase());
  const decision = optional && (state === 'RED' || state === 'EXHAUSTED')
    ? 'BUDGET_DEFERRED'
    : state === 'ORANGE'
      ? 'CHEAP_PATH'
      : 'RUN';
  return Object.freeze({
    state,
    remainingCredits,
    dailyAllowance,
    paceRatio,
    decision,
    reason: decision === 'BUDGET_DEFERRED' ? 'MONTHLY_BUDGET_GUARD' : 'WITHIN_POLICY',
  });
}
